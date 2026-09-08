from pyspark.sql import SparkSession
from pyspark.sql import functions as F
import os
from pyspark.sql.functions import col, concat, lit, rand, floor
from pyspark.sql.functions import count as count_func
from pyspark.sql.window import Window


spark = SparkSession \
    .builder \
    .appName("Distributed Compute Examples") \
    .config("spark.jars.packages", "ai.telemetria:optima-spark_2.12:0.1.1") \
    .config("spark.plugins", "io.telemetria.optima.SparkOptimaPlugin") \
    .config("spark.ui.port", "11000") \
    .master("local[*]") \
    .getOrCreate()


df = spark.read.load(os.getenv('SALES_FILES_LOCATION'))


spark.sparkContext.setJobDescription("GroupBy store and customer - default partitioning")
grouped_count = df.groupBy("ss_store_sk", "ss_customer_sk").count()
grouped_count.collect()


spark.sparkContext.setJobDescription("GroupBy store and customer - with repartition")
grouped_count = df.repartition("ss_store_sk", "ss_customer_sk") \
                  .groupBy("ss_store_sk", "ss_customer_sk") \
                  .count()
grouped_count.collect()


num_salts = 8

df_with_salt = df.withColumn(
    "salt",
    floor(rand(seed=42) * num_salts)
)

spark.sparkContext.setJobDescription("GroupBy store and customer - with salting")
grouped_count_final = df_with_salt.groupBy("ss_store_sk", "ss_customer_sk", "salt") \
            .count() \
            .groupBy("ss_store_sk", "ss_customer_sk") \
            .count()
grouped_count_final.collect()



spark.sparkContext.setJobDescription("GroupBy with join - count by store and customer, filter > 3 or > 5")
store_counts = df.groupBy("ss_store_sk") \
    .agg(count_func("*").alias("store_count")) \
    .filter(col("store_count") > 3)

customer_counts = df.groupBy("ss_customer_sk") \
    .agg(count_func("*").alias("customer_count")) \
    .filter(col("customer_count") > 5)

join_result = df.select("ss_store_sk", "ss_customer_sk") \
    .join(store_counts, "ss_store_sk", "left") \
    .join(customer_counts, "ss_customer_sk", "left") \
    .filter(col("store_count").isNotNull() | col("customer_count").isNotNull()) \
    .count()


spark.sparkContext.setJobDescription("Window functions - count by store and customer, filter > 3")
df_with_store_count = df.select("ss_store_sk", "ss_customer_sk") \
    .withColumn("store_count", count_func("*").over(Window.partitionBy("ss_store_sk"))) \
    .withColumn("customer_count", count_func("*").over(Window.partitionBy("ss_customer_sk"))) \
    .filter((col("store_count") > 3) | (col("customer_count") > 5)) \
    .count()


spark.sparkContext.setJobDescription("Multiple countDistinct aggregations")
dfCounts = df.select(
    F.countDistinct(F.col("ss_customer_sk")).alias("distinct_customers"),
    F.countDistinct(F.col("ss_item_sk")).alias("distinct_items"),
    F.countDistinct(F.col("ss_store_sk")).alias("distinct_stores"),
    F.countDistinct(F.col("ss_promo_sk")).alias("distinct_promotions")
)
dfCounts.show()