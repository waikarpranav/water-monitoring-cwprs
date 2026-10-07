import pandas as pd

# Load raw dataset
df = pd.read_csv("dataset/water_potability.csv")

# Keep only the columns we actually need
df = df[["ph", "Turbidity", "Sulfate", "Potability"]]

# Fill missing values with the column median (robust to outliers)
df["ph"] = df["ph"].fillna(df["ph"].median())
df["Sulfate"] = df["Sulfate"].fillna(df["Sulfate"].median())

# Sanity checks
print("=== Missing values after cleaning ===")
print(df.isnull().sum())

print("\n=== Shape after cleaning ===")
print(df.shape)

print("\n=== Class balance ===")
print(df["Potability"].value_counts())

# Save the cleaned dataset
df.to_csv("dataset/water_potability_clean.csv", index=False)
print("\nSaved cleaned dataset to dataset/water_potability_clean.csv")