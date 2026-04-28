// AudioWorkletProcessor for soft-clamp and soft-knee compression
class SoftclampProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.softKneeState = 0;
    this.clipState = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output) return true;

    for (let channel = 0; channel < output.length; channel++) {
      const inputBuffer = input[channel] || new Float32Array(output[channel].length);
      const outputBuffer = output[channel];

      for (let i = 0; i < outputBuffer.length; i++) {
        let sample = inputBuffer[i];

        // Soft-knee compression to tame the tail
        const threshold = 0.6;
        const ratio = 4;
        const knee = 0.1;

        if (Math.abs(sample) > threshold + knee) {
          const excess = Math.abs(sample) - (threshold + knee);
          const compressed = (threshold + knee + excess / ratio) * Math.sign(sample);
          sample = compressed;
        } else if (Math.abs(sample) > threshold - knee) {
          const kneeFactor = (Math.abs(sample) - (threshold - knee)) / (2 * knee);
          const excess = Math.abs(sample) - threshold;
          if (excess > 0) {
            const compressed = threshold + (excess / ratio) * kneeFactor + excess * (1 - kneeFactor);
            sample = compressed * Math.sign(sample);
           }
         }

        // Soft-clamp: smooth tanh-based clipping
        const clampThreshold = 0.85;
        if (Math.abs(sample) > clampThreshold) {
          const above = (Math.abs(sample) - clampThreshold) / (1 - clampThreshold);
          const clamped = clampThreshold + (1 - clampThreshold) * Math.tanh(above * 3);
          sample = clamped * Math.sign(sample);

          this.clipState += (1 - Math.abs(sample)) * 0.1;
         } else {
          this.clipState *= 0.95;
         }

        // Anti-aliasing: gentle decimation low-pass (1-pole, ~8kHz cutoff at 48kHz SR)
        const aaCoeff = 0.85;
        this.softKneeState = this.softKneeState * aaCoeff + sample * (1 - aaCoeff);
        outputBuffer[i] = this.softKneeState;
      }
   }

    return true;
  }
}

registerProcessor("softclamp-processor", SoftclampProcessor);
