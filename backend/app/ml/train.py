import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Load the cleaned dataset
df = pd.read_csv("dataset/water_potability_clean.csv")

FEATURES = ["ph", "Turbidity", "Sulfate"]
X = df[FEATURES]
y = df["Potability"]

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Build the pipeline: scale features, then train Random Forest
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        class_weight="balanced",
        random_state=42
    )),
])

pipe.fit(X_train, y_train)

# Evaluate
y_pred = pipe.predict(X_test)
print("=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["Not Safe", "Safe"]))

# Save the trained model
joblib.dump(pipe, "model.pkl")
print("Saved trained model to model.pkl")