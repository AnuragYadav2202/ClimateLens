import * as tf from "@tensorflow/tfjs";

export interface PredictionResult {
  year: number;
  value: number;
}

/**
 * Predicts future climate trends using a simple linear regression model in the browser.
 * @param historicalData Time-series of {year, value}
 * @param futureYears Number of years to predict into the future
 */
export async function predictFutureTrend(
  historicalData: { year: number; value: number }[],
  futureYears: number = 20
): Promise<PredictionResult[]> {
  if (historicalData.length < 2) return [];

  // Normalize data for better training
  const years = historicalData.map((d) => d.year);
  const values = historicalData.map((d) => d.value);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  // Convert to Tensors
  const xs = tf.tensor2d(years.map(y => (y - minYear) / (maxYear - minYear)), [years.length, 1]);
  const ys = tf.tensor2d(values, [values.length, 1]);

  // Build a simple sequential model: 1 layer linear regression
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Compile with Adam optimizer and Mean Squared Error loss
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  // Train the model
  await model.fit(xs, ys, {
    epochs: 100,
    verbose: 0
  });

  // Predict future years
  const lastYear = years[years.length - 1];
  const predictions: PredictionResult[] = [];

  for (let i = 1; i <= futureYears; i++) {
    const targetYear = lastYear + i;
    const normalizedTarget = (targetYear - minYear) / (maxYear - minYear);
    
    const output = model.predict(tf.tensor2d([normalizedTarget], [1, 1])) as tf.Tensor;
    const predictedValue = (await output.data())[0];
    
    predictions.push({
      year: targetYear,
      value: Math.round(predictedValue * 100) / 100
    });
    
    output.dispose();
  }

  // Cleanup tensors
  xs.dispose();
  ys.dispose();
  
  return predictions;
}
