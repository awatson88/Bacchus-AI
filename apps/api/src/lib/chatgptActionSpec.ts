export function buildChatGptActionOpenApiSpec(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "BartenderGPT",
      version: "0.1.0",
      description:
        "Actions for extracting bottles from uploaded photos, reviewing candidates, approving inventory updates, and querying BartenderGPT inventory."
    },
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API token"
        }
      }
    },
    servers: [
      {
        url: serverUrl
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      "/api/v1/chatgpt/intake/extract": {
        post: {
          operationId: "extractIntakeFromUploads",
          summary: "Extract bottle candidates from uploaded images.",
          description:
            "Create a BartenderGPT intake review job from files uploaded in ChatGPT. Use when the user wants to add bottles from screenshots or shopping photos.",
          "x-openai-isConsequential": false,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    message: {
                      type: "string",
                      description:
                        "User request or context, such as 'Add these bottles to my bar inventory.'"
                    },
                    location: {
                      type: "string",
                      description:
                        "Optional storage location like Bar Cart or Wine Fridge."
                    },
                    openaiFileIdRefs: {
                      type: "array",
                      description:
                        "Files uploaded in the ChatGPT conversation. ChatGPT provides rich file metadata at runtime.",
                      minItems: 1,
                      maxItems: 10,
                      items: {
                        type: "string"
                      }
                    }
                  },
                  required: ["message", "openaiFileIdRefs"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Created intake review job with extracted bottle candidates."
            }
          }
        }
      },
      "/api/v1/chatgpt/intake/jobs/{jobId}/review": {
        post: {
          operationId: "reviewIntakeCandidate",
          summary: "Edit or reject one extracted bottle candidate.",
          description:
            "Update a single bottle candidate after the user confirms or corrects it.",
          "x-openai-isConsequential": false,
          parameters: [
            {
              name: "jobId",
              in: "path",
              required: true,
              schema: {
                type: "string"
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    candidateId: {
                      type: "string"
                    },
                    decision: {
                      type: "string",
                      enum: ["pending", "approved", "rejected"]
                    },
                    category: {
                      type: "string",
                      enum: [
                        "wine",
                        "spirit",
                        "liqueur",
                        "aperitif",
                        "bitters",
                        "syrup",
                        "mixer"
                      ]
                    },
                    producer: {
                      type: "string"
                    },
                    label: {
                      type: "string"
                    },
                    vintage: {
                      type: "integer"
                    },
                    country: {
                      type: "string"
                    },
                    region: {
                      type: "string"
                    },
                    baseSpirit: {
                      type: "string"
                    },
                    style: {
                      type: "string"
                    },
                    grapeVarieties: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    location: {
                      type: "string"
                    },
                    bin: {
                      type: "string"
                    },
                    quantity: {
                      type: "integer"
                    },
                    drinkFrom: {
                      type: "string",
                      format: "date-time"
                    },
                    drinkTo: {
                      type: "string",
                      format: "date-time"
                    },
                    qualityScore: {
                      type: "number"
                    },
                    estimatedPriceUsd: {
                      type: "number"
                    },
                    priceTier: {
                      type: "string",
                      enum: ["everyday", "special", "splurge"]
                    },
                    confidence: {
                      type: "number"
                    },
                    notes: {
                      type: "string"
                    },
                    reasoning: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    }
                  },
                  required: ["candidateId"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Updated intake review job."
            }
          }
        }
      },
      "/api/v1/chatgpt/intake/jobs/{jobId}/approve": {
        post: {
          operationId: "approveIntakeCandidates",
          summary: "Approve selected bottle candidates into inventory.",
          description:
            "Create inventory records for one or more confirmed bottle candidates.",
          "x-openai-isConsequential": true,
          parameters: [
            {
              name: "jobId",
              in: "path",
              required: true,
              schema: {
                type: "string"
              }
            }
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    candidateIds: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    overridesByCandidateId: {
                      type: "object",
                      additionalProperties: {
                        type: "object"
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Approved inventory records."
            }
          }
        }
      },
      "/api/v1/inventory/items": {
        get: {
          operationId: "searchInventory",
          summary: "Search BartenderGPT inventory.",
          description:
            "Search current wine and liquor inventory by category, status, or location.",
          security: [],
          parameters: [
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "wine",
                  "spirit",
                  "liqueur",
                  "aperitif",
                  "bitters",
                  "syrup",
                  "mixer"
                ]
              }
            },
            {
              name: "location",
              in: "query",
              schema: {
                type: "string"
              }
            },
            {
              name: "bin",
              in: "query",
              schema: {
                type: "string"
              }
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["sealed", "open", "low", "empty", "consumed", "missing"]
              }
            }
          ],
          responses: {
            "200": {
              description: "Inventory results."
            }
          }
        }
      },
      "/api/v1/inventory/drink-now": {
        get: {
          operationId: "getDrinkNowCandidates",
          summary: "List wines nearing the end of their drink window.",
          description:
            "Return wine bottles that should be prioritized for drinking soon.",
          security: [],
          responses: {
            "200": {
              description: "Drink now results."
            }
          }
        }
      },
      "/api/v1/inventory/items/{id}/consume": {
        post: {
          operationId: "consumeInventoryItem",
          summary: "Mark one bottle as consumed.",
          description:
            "Use after the user says a specific wine or bottle was opened and finished. Marks one physical bottle record as consumed.",
          "x-openai-isConsequential": true,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "string"
              }
            }
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    notes: {
                      type: "string"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Inventory item marked consumed."
            }
          }
        }
      },
      "/api/v1/recommendations/wine": {
        post: {
          operationId: "suggestWinesForMeal",
          summary: "Suggest wines for a meal from current inventory.",
          description:
            "Recommend in-stock wines using the meal, mood, and weather context.",
          "x-openai-isConsequential": false,
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    meal: {
                      type: "string"
                    },
                    mood: {
                      type: "string"
                    },
                    weatherSummary: {
                      type: "string"
                    },
                    budgetPreference: {
                      type: "string",
                      enum: ["everyday", "special", "splurge"]
                    }
                  },
                  required: ["meal"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Wine recommendations."
            }
          }
        }
      },
      "/api/v1/recommendations/cocktails": {
        post: {
          operationId: "suggestCocktails",
          summary: "Suggest cocktails from current inventory.",
          description:
            "Recommend cocktails based on liquor inventory, mood, weather, and base spirit preference.",
          "x-openai-isConsequential": false,
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    mood: {
                      type: "string"
                    },
                    weatherSummary: {
                      type: "string"
                    },
                    preferredBaseSpirit: {
                      type: "string"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Cocktail recommendations."
            }
          }
        }
      }
    }
  };
}
