import pandas as pd

# Load the dataset
df = pd.read_csv("dataset/water_potability.csv")

print("=== Shape ===")
print(df.shape)

print("\n=== Columns ===")
print(df.columns.tolist())

print("\n=== Missing values per column ===")
print(df.isnull().sum())

print("\n=== Class balance (Potability) ===")
print(df["Potability"].value_counts())

print("\n=== Stats for our 3 features ===")
print(df[["ph", "Turbidity", "Sulfate"]].describe())

print("\n=== Duplicate rows ===")
print(df.duplicated().sum())