import rawIntegratedTraining from "./integrated_training_data.json"

export const integratedTrainingMeta = {
  module: rawIntegratedTraining.module,
  description: rawIntegratedTraining.description,
  uiRules: rawIntegratedTraining.ui_rules,
}

export const integratedTrainingItems = rawIntegratedTraining.items ?? []
