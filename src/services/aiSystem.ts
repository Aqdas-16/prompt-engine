export const feature_registry = {};

export function buildContext(userInput: string, sessionContext: any) {
  let context = `Task/Topic: ${userInput}\n`;
  if (sessionContext.intent) context += `Intent: ${sessionContext.intent}\n`;
  if (sessionContext.audience) context += `Target Audience: ${sessionContext.audience}\n`;
  if (sessionContext.platform) context += `Platform: ${sessionContext.platform}\n`;
  if (sessionContext.goal) context += `Goal/Outcome: ${sessionContext.goal}\n`;
  if (sessionContext.constraints) context += `Constraints: ${sessionContext.constraints}\n`;
  return context;
}

export function buildFinalPrompt(userInput: string, sessionContext: any) {
  const context = buildContext(userInput, sessionContext);
  return `${context}`;
}

