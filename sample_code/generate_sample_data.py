"""
Generates a TPC-DS `store_sales`-shaped parquet dataset for pysparkcode.py.

pysparkcode.py reads whatever `SALES_FILES_LOCATION` points at and expects the
columns ss_store_sk, ss_customer_sk, ss_item_sk and ss_promo_sk.

The store key is deliberately skewed - a handful of stores carry most of the
rows - so the salting and repartition steps in that script have something real
to fix, and so Optima's skew/shuffle alerts actually fire. A uniform dataset
would run fine and show you nothing.

    python generate_sample_data.py [output_dir] [num_rows]
"""

import sys

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

DEFAULT_ROWS = 4_000_000
NUM_STORES = 200
NUM_CUSTOMERS = 60_000
NUM_ITEMS = 20_000
NUM_PROMOS = 500


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "data/store_sales"
    rows = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_ROWS

    spark = (
        SparkSession.builder.appName("Generate sample store_sales")
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "16")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")

    df = spark.range(0, rows).withColumn("r", F.rand(seed=7))

    # ~65% of rows land on 5 "mega" stores; the rest spread over NUM_STORES.
    skewed_store = (
        F.when(F.col("r") < 0.65, (F.col("id") % 5).cast("int"))
        .otherwise((F.col("id") % NUM_STORES).cast("int"))
    )

    df = (
        df.withColumn("ss_store_sk", skewed_store)
        .withColumn(
            "ss_customer_sk",
            (F.floor(F.rand(seed=11) * NUM_CUSTOMERS)).cast("int"),
        )
        .withColumn(
            "ss_item_sk", (F.floor(F.rand(seed=13) * NUM_ITEMS)).cast("int")
        )
        .withColumn(
            "ss_promo_sk",
            # Most sales carry no promotion, as in the real schema.
            F.when(F.rand(seed=17) < 0.2, F.floor(F.rand(seed=19) * NUM_PROMOS))
            .otherwise(F.lit(None))
            .cast("int"),
        )
        .withColumn(
            "ss_quantity", (F.floor(F.rand(seed=23) * 20) + 1).cast("int")
        )
        .withColumn(
            "ss_sales_price", F.round(F.rand(seed=29) * 300, 2).cast("double")
        )
        .drop("r", "id")
    )

    df.write.mode("overwrite").parquet(out)

    written = spark.read.parquet(out)
    print("=" * 64)
    print(f"Wrote {written.count():,} rows to {out}")
    print("Top stores by row count (showing the intended skew):")
    (
        written.groupBy("ss_store_sk")
        .count()
        .orderBy(F.desc("count"))
        .show(8, truncate=False)
    )
    written.printSchema()
    print("=" * 64)

    spark.stop()


if __name__ == "__main__":
    main()
