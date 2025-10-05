// services/riskService.js
function calculateRiskLevel(sensitivity, threats) {
  if (threats.length > 0) return "high";

  switch (sensitivity) {
    case "Critical":
      return "high";
    case "High":
      return "medium";
    case "Moderate":
      return "low";
    default:
      return "low";
  }
}

module.exports = { calculateRiskLevel };
