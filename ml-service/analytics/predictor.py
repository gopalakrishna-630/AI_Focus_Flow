from sklearn.linear_model import LinearRegression
import numpy as np

def predict_next_week(scores):
    if len(scores) < 2:
        return scores[-1] if scores else 0

    X = np.arange(len(scores)).reshape(-1,1)
    y = np.array(scores)

    model = LinearRegression()
    model.fit(X, y)

    return float(model.predict([[len(scores)]])[0])
