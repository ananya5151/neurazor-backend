/**
 * NeuRazor Scoring Calculator Service
 * Contains all scoring formulas for all games
 * This is the SECRET SAUCE - formulas stay on server
 */

class CalculatorService {

    /**
     * Main entry point - calculates scores for any game
     */
    /**
     * Main entry point - calculates scores for any game
     */
    calculateScores(gameType, rawData, config, aiScores = null) {
        switch (gameType) {
            case 'mental_math_sprint':
                return this.calculateMentalMath(rawData, config);
            case 'stroop_test':
                return this.calculateStroop(rawData, config);
            case 'face_name_match':
                return this.calculateFaceName(rawData, config);
            case 'sign_sudoku':
                return this.calculateSudoku(rawData, config);
            case 'card_flip_challenge':
                return this.calculateCardFlip(rawData, config);
            case 'lucky_flip':
                return this.calculateLuckyFlip(rawData, config);
            case 'vocab_challenge':
                return this.calculateVocabChallenge(rawData, config);

            // AI-scored games
            case 'scenario_challenge':
            case 'ai_debate':
            case 'statement_reasoning':
            case 'creative_uses':
                if (!aiScores) {
                    throw new Error(`${gameType} requires AI scoring. Call /api/ai/score first.`);
                }
                return this.calculateAIGame(rawData, config, aiScores);

            default:
                throw new Error(`Unknown game type: ${gameType}`);
        }
    }

    /**
     * Mental Math Sprint Calculator
     */
    calculateMentalMath(rawData, config) {
        const weights = config.final_weights;
        const formulas = config.competency_formulas;
        const settings = config.settings;

        // Calculate raw competency scores
        let accuracy;
        if (settings.accuracy_mode === 'binary') {
            // Binary: 100 or 0
            const correct = rawData.filter(q => q.is_correct).length;
            accuracy = (correct / rawData.length) * 100;
        } else {
            // Graded: based on error percentage
            const avgError = rawData.reduce((sum, q) => {
                const error = Math.abs(q.user_answer - q.correct_answer);
                return sum + (error / q.correct_answer);
            }, 0) / rawData.length;
            accuracy = Math.max(0, 100 - (avgError * 100));
        }

        // Speed
        const totalTime = rawData.reduce((sum, q) => sum + q.time_taken, 0);
        const avgTime = totalTime / rawData.length;
        const timeLimit = settings.time_limit || 5;
        const speed = Math.max(0, ((timeLimit - avgTime) / timeLimit) * 100);

        // Quantitative Aptitude
        const quantitativeAptitude = (accuracy * 0.7) + (speed * 0.3);

        // Mental Stamina (consistency)
        const speeds = rawData.map(q => q.time_taken);
        const stdDev = this.calculateStdDev(speeds);
        const mentalStamina = (speed * 0.5) + Math.max(0, 100 - stdDev * 10);

        // Calculate weighted final score
        const finalScore =
            (accuracy * weights.accuracy) +
            (speed * weights.speed) +
            (quantitativeAptitude * weights.quantitative_aptitude) +
            (mentalStamina * weights.mental_stamina);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                accuracy: {
                    raw: parseFloat(accuracy.toFixed(2)),
                    weighted: parseFloat((accuracy * weights.accuracy).toFixed(2)),
                    weight: weights.accuracy
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                },
                quantitative_aptitude: {
                    raw: parseFloat(quantitativeAptitude.toFixed(2)),
                    weighted: parseFloat((quantitativeAptitude * weights.quantitative_aptitude).toFixed(2)),
                    weight: weights.quantitative_aptitude
                },
                mental_stamina: {
                    raw: parseFloat(mentalStamina.toFixed(2)),
                    weighted: parseFloat((mentalStamina * weights.mental_stamina).toFixed(2)),
                    weight: weights.mental_stamina
                }
            },
            raw_stats: {
                total_questions: rawData.length,
                correct_answers: rawData.filter(q => q.is_correct).length,
                total_time: parseFloat(totalTime.toFixed(2)),
                avg_time_per_question: parseFloat(avgTime.toFixed(2))
            }
        };
    }

    /**
     * Stroop Test Calculator
     */
    calculateStroop(rawData, config) {
        const weights = config.final_weights;

        // Accuracy
        const correct = rawData.filter(q => q.is_correct).length;
        const accuracy = (correct / rawData.length) * 100;

        // Speed
        const avgTime = rawData.reduce((sum, q) => sum + q.time_taken, 0) / rawData.length;
        const maxTime = 5; // max allowed per item
        const speed = Math.max(0, 100 - ((avgTime / maxTime) * 40));

        // Cognitive Agility
        const cognitiveAgility = (accuracy * 0.6) + (speed * 0.4);

        // Cognitive Flexibility (based on interference)
        const interferenceScore = rawData.filter(q => q.is_interference && !q.is_correct).length;
        const cognitiveFlexibility = Math.max(0, 100 - (interferenceScore * 5));

        const finalScore =
            (cognitiveFlexibility * weights.cognitive_flexibility) +
            (cognitiveAgility * weights.cognitive_agility) +
            (accuracy * weights.accuracy) +
            (speed * weights.speed);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                cognitive_flexibility: {
                    raw: parseFloat(cognitiveFlexibility.toFixed(2)),
                    weighted: parseFloat((cognitiveFlexibility * weights.cognitive_flexibility).toFixed(2)),
                    weight: weights.cognitive_flexibility
                },
                cognitive_agility: {
                    raw: parseFloat(cognitiveAgility.toFixed(2)),
                    weighted: parseFloat((cognitiveAgility * weights.cognitive_agility).toFixed(2)),
                    weight: weights.cognitive_agility
                },
                accuracy: {
                    raw: parseFloat(accuracy.toFixed(2)),
                    weighted: parseFloat((accuracy * weights.accuracy).toFixed(2)),
                    weight: weights.accuracy
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                }
            },
            raw_stats: {
                total_items: rawData.length,
                correct_responses: correct,
                avg_response_time: parseFloat(avgTime.toFixed(2))
            }
        };
    }

    /**
     * Face-Name Match Calculator
     */
    calculateFaceName(rawData, config) {
        const weights = config.final_weights;

        // Accuracy
        const correct = rawData.filter(q => q.is_correct).length;
        const accuracy = (correct / rawData.length) * 100;

        // Speed
        const avgTime = rawData.reduce((sum, q) => sum + q.time_taken, 0) / rawData.length;
        const maxTime = 10;
        const speed = Math.max(0, 100 * (1 - (avgTime / maxTime)));

        // Retention (for recall phase)
        const retention = accuracy; // Simplified for now

        // Memory (composite)
        const memory = (retention * 0.4) + (accuracy * 0.3) + (speed * 0.3);

        const finalScore =
            (memory * weights.memory) +
            (accuracy * weights.accuracy) +
            (speed * weights.speed);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                memory: {
                    raw: parseFloat(memory.toFixed(2)),
                    weighted: parseFloat((memory * weights.memory).toFixed(2)),
                    weight: weights.memory
                },
                accuracy: {
                    raw: parseFloat(accuracy.toFixed(2)),
                    weighted: parseFloat((accuracy * weights.accuracy).toFixed(2)),
                    weight: weights.accuracy
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                }
            },
            raw_stats: {
                total_attempts: rawData.length,
                correct_matches: correct,
                avg_time_per_response: parseFloat(avgTime.toFixed(2))
            }
        };
    }

    /**
     * Sign Sudoku Calculator
     */
    calculateSudoku(rawData, config) {
        const weights = config.final_weights;
        const penalties = config.penalties || {};

        const correctEntries = rawData.correct_entries || 0;
        const incorrectEntries = rawData.incorrect_entries || 0;
        const totalEmpty = rawData.total_empty_cells || 16;
        const timeLeft = rawData.time_left_sec || 0;
        const totalTime = rawData.total_time_allowed || 60;
        const avgTimePerCorrect = rawData.avg_time_per_correct_entry || 1;
        const difficultyMultiplier = rawData.difficulty_multiplier || 1;

        // Accuracy
        const accuracy = Math.max(0, ((correctEntries / totalEmpty) * 100) - (incorrectEntries * (penalties.incorrect_penalty || 3)));

        // Reasoning
        const totalAttempts = correctEntries + incorrectEntries;
        const reasoning = ((correctEntries / Math.max(1, totalAttempts)) * 100) * difficultyMultiplier;

        // Speed
        const speed = (timeLeft / totalTime * 50) + (50 / (avgTimePerCorrect + 1));

        // Math
        const math = (correctEntries / totalEmpty) * 100;

        // Attention to Detail
        const attentionToDetail = (accuracy * 0.6) + (rawData.correct_first_attempts || 0) / totalEmpty * 40;

        const finalScore =
            (accuracy * weights.accuracy) +
            (reasoning * weights.reasoning) +
            (attentionToDetail * weights.attention_to_detail) +
            (speed * weights.speed) +
            (math * weights.math);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                accuracy: {
                    raw: parseFloat(accuracy.toFixed(2)),
                    weighted: parseFloat((accuracy * weights.accuracy).toFixed(2)),
                    weight: weights.accuracy
                },
                reasoning: {
                    raw: parseFloat(reasoning.toFixed(2)),
                    weighted: parseFloat((reasoning * weights.reasoning).toFixed(2)),
                    weight: weights.reasoning
                },
                attention_to_detail: {
                    raw: parseFloat(attentionToDetail.toFixed(2)),
                    weighted: parseFloat((attentionToDetail * weights.attention_to_detail).toFixed(2)),
                    weight: weights.attention_to_detail
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                },
                math: {
                    raw: parseFloat(math.toFixed(2)),
                    weighted: parseFloat((math * weights.math).toFixed(2)),
                    weight: weights.math
                }
            },
            raw_stats: {
                correct_entries: correctEntries,
                incorrect_entries: incorrectEntries,
                time_left: timeLeft
            }
        };
    }

    /**
     * Card Flip Challenge Calculator
     */
    calculateCardFlip(rawData, config) {
        const weights = config.final_weights;

        const correctPairs = rawData.correct_pairs || 0;
        const totalPairs = rawData.total_pairs || 10;
        const totalFlips = rawData.total_flips || 20;
        const minFlips = rawData.minimum_flips || totalPairs * 2;
        const timeTaken = rawData.time_taken || 0;
        const timeLimit = rawData.time_limit || 60;
        const patternDiscovered = rawData.pattern_discovered || false;

        // Pattern Recognition
        const patternRecognition = (correctPairs / totalPairs) * 100;

        // Reasoning
        const reasoning = ((minFlips / totalFlips) * 100 * 0.5) + (patternRecognition * 0.5);

        // Speed
        const speed = Math.max(0, ((timeLimit - timeTaken) / timeLimit) * 100);

        // Strategy (bonus for discovering pattern)
        const strategyScore = patternDiscovered ? 100 : 50;

        const finalScore =
            (patternRecognition * weights.pattern_recognition) +
            (reasoning * weights.reasoning) +
            (strategyScore * weights.strategy) +
            (speed * weights.speed);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                pattern_recognition: {
                    raw: parseFloat(patternRecognition.toFixed(2)),
                    weighted: parseFloat((patternRecognition * weights.pattern_recognition).toFixed(2)),
                    weight: weights.pattern_recognition
                },
                reasoning: {
                    raw: parseFloat(reasoning.toFixed(2)),
                    weighted: parseFloat((reasoning * weights.reasoning).toFixed(2)),
                    weight: weights.reasoning
                },
                strategy: {
                    raw: parseFloat(strategyScore.toFixed(2)),
                    weighted: parseFloat((strategyScore * weights.strategy).toFixed(2)),
                    weight: weights.strategy
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                }
            },
            raw_stats: {
                correct_pairs: correctPairs,
                total_flips: totalFlips,
                time_taken: timeTaken,
                pattern_discovered: patternDiscovered
            }
        };
    }

    /**
     * Lucky Flip Calculator
     */
    calculateLuckyFlip(rawData, config) {
        const weights = config.final_weights;
        const penalties = config.penalties || {};
        const bonuses = config.bonuses || {};

        const roundsCompleted = rawData.rounds_completed || 0;
        const totalRounds = rawData.total_rounds || 10;
        const timesWentBust = rawData.times_went_bust || 0;
        const voluntaryStops = rawData.voluntary_stops_at_optimal_points || 0;
        const finalCredits = rawData.final_credits || 0;
        const startingCredits = rawData.starting_credits || 100;

        // Drive (calculated, not AI)
        const drive = Math.max(0,
            ((roundsCompleted / totalRounds) * 100) -
            (timesWentBust * (penalties.bust_penalty || 10)) +
            (voluntaryStops * (bonuses.optimal_stop_bonus || 5))
        );

        // Risk Appetite & Reasoning will be AI-scored
        // For now, we'll use placeholder values
        // The frontend should call /api/ai/score separately for these
        const riskAppetite = 50; // Placeholder - will be replaced by AI
        const reasoning = 50; // Placeholder - will be replaced by AI

        const finalScore =
            (riskAppetite * weights.risk_appetite) +
            (drive * weights.drive) +
            (reasoning * weights.reasoning);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                risk_appetite: {
                    raw: parseFloat(riskAppetite.toFixed(2)),
                    weighted: parseFloat((riskAppetite * weights.risk_appetite).toFixed(2)),
                    weight: weights.risk_appetite,
                    requires_ai: true
                },
                drive: {
                    raw: parseFloat(drive.toFixed(2)),
                    weighted: parseFloat((drive * weights.drive).toFixed(2)),
                    weight: weights.drive
                },
                reasoning: {
                    raw: parseFloat(reasoning.toFixed(2)),
                    weighted: parseFloat((reasoning * weights.reasoning).toFixed(2)),
                    weight: weights.reasoning,
                    requires_ai: true
                }
            },
            raw_stats: {
                rounds_completed: roundsCompleted,
                times_went_bust: timesWentBust,
                final_credits: finalCredits,
                profit_loss: finalCredits - startingCredits
            }
        };
    }

    /**
     * Vocab Challenge Calculator
     */
    calculateVocabChallenge(rawData, config) {
        const weights = config.final_weights;

        const validWords = rawData.unique_valid_words || 0;
        const totalWords = rawData.total_words_entered || 1;
        const timeTaken = rawData.time_taken || 1;
        const timeLimit = rawData.time_limit || 60;

        // Vocabulary
        const vocabulary = (validWords / totalWords) * 100;

        // Speed (capped at 100)
        const speed = Math.min(100, (validWords / timeLimit) * 100);

        const finalScore =
            (vocabulary * weights.vocabulary) +
            (speed * weights.speed);

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: {
                vocabulary: {
                    raw: parseFloat(vocabulary.toFixed(2)),
                    weighted: parseFloat((vocabulary * weights.vocabulary).toFixed(2)),
                    weight: weights.vocabulary
                },
                speed: {
                    raw: parseFloat(speed.toFixed(2)),
                    weighted: parseFloat((speed * weights.speed).toFixed(2)),
                    weight: weights.speed
                }
            },
            raw_stats: {
                unique_valid_words: validWords,
                total_words_entered: totalWords,
                time_taken: timeTaken
            }
        };
    }

    /**
     * AI-Scored Games Placeholder
     * These games require AI evaluation
     */
    calculateAIGame(rawData, config, aiScores) {
        const weights = config.final_weights;

        // AI scores should be provided by the AI service
        // Format: { competency_name: score_0_to_100 }

        let finalScore = 0;
        const competencies = {};

        for (const [competencyName, weight] of Object.entries(weights)) {
            const rawScore = aiScores[competencyName] || 0;
            const weighted = rawScore * weight;

            competencies[competencyName] = {
                raw: parseFloat(rawScore.toFixed(2)),
                weighted: parseFloat(weighted.toFixed(2)),
                weight: weight,
                scored_by_ai: true
            };

            finalScore += weighted;
        }

        return {
            final_score: parseFloat(finalScore.toFixed(2)),
            competencies: competencies,
            raw_stats: {
                response_length: rawData.response_text?.length || 0,
                ai_evaluated: true
            }
        };
    }
    calculateStdDev(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
}

module.exports = new CalculatorService();