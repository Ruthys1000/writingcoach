#!/usr/bin/env ts-node
"use strict";
// ============================================================
// WritingCoach — Interactive CLI
// The user-facing entry point. Guides the user through the
// 3-step learning loop with a rich terminal interface.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const readline = __importStar(require("readline"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const factory_1 = require("./llm/factory");
const coach_1 = require("./coach");
// ---- Helpers ----
function printDivider(char = '─', width = 60) {
    console.log(chalk_1.default.gray(char.repeat(width)));
}
function printHeader() {
    console.clear();
    console.log('');
    console.log(chalk_1.default.bold.blue('  ✍️  מאמן הכתיבה המנהלית'));
    console.log(chalk_1.default.gray('  Personal Administrative Writing Coach'));
    console.log('');
    printDivider('═');
    console.log('');
}
function printScoreBar(label, score, width = 30) {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    const color = score >= 80 ? chalk_1.default.green : score >= 60 ? chalk_1.default.yellow : chalk_1.default.red;
    const bar = color('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty));
    const pct = color(`${score}%`);
    console.log(`  ${label.padEnd(22)} ${bar} ${pct}`);
}
async function readMultilineInput(prompt) {
    console.log(chalk_1.default.cyan(prompt));
    console.log(chalk_1.default.gray('(הדבק את הטקסט, לאחר מכן לחץ Enter פעמיים לסיום)'));
    console.log('');
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin });
        const lines = [];
        let emptyLineCount = 0;
        rl.on('line', (line) => {
            if (line.trim() === '') {
                emptyLineCount++;
                if (emptyLineCount >= 2) {
                    rl.close();
                }
                else {
                    lines.push(line);
                }
            }
            else {
                emptyLineCount = 0;
                lines.push(line);
            }
        });
        rl.on('close', () => {
            resolve(lines.join('\n').trim());
        });
    });
}
function printSpinner(text) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const timer = setInterval(() => {
        process.stdout.write(`\r  ${chalk_1.default.cyan(frames[i % frames.length])} ${chalk_1.default.gray(text)}`);
        i++;
    }, 100);
    return () => {
        clearInterval(timer);
        process.stdout.write('\r' + ' '.repeat(text.length + 6) + '\r');
    };
}
// ---- Display Functions ----
function displayDiagnosticReport(report, recipe) {
    console.log('');
    console.log(chalk_1.default.bold.white(`  📊 דו"ח אבחון — ${report.recipe_name}`));
    console.log('');
    // Overall score
    const overallColor = report.scores.overall >= 80
        ? chalk_1.default.green
        : report.scores.overall >= 60
            ? chalk_1.default.yellow
            : chalk_1.default.red;
    console.log(`  ציון כולל: ${overallColor.bold(`${report.scores.overall}/100`)}`);
    console.log('');
    // Score bars
    printScoreBar('רובד תשתיתי (שפה)', report.scores.foundational.score);
    printScoreBar('רובד ספציפי (מסמך)', report.scores.document_specific.score);
    console.log('');
    printDivider();
    console.log('');
    // Detailed results
    console.log(chalk_1.default.bold('  פירוט הערכה:'));
    console.log('');
    for (const eval_ of report.evaluations) {
        const criterion = recipe.criteria.find((c) => c.id === eval_.criterion_id);
        const icon = eval_.passed ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
        const label = criterion?.question ?? eval_.criterion_id;
        console.log(`  ${icon} ${chalk_1.default.white(label.length > 60 ? label.slice(0, 57) + '...' : label)}`);
        if (!eval_.passed) {
            console.log(`    ${chalk_1.default.gray(eval_.explanation)}`);
            if (eval_.excerpt) {
                console.log(`    ${chalk_1.default.italic.gray(`"${eval_.excerpt.slice(0, 80)}..."`)}`);
            }
        }
        console.log('');
    }
    // Gap summary
    if (report.gaps.length === 0) {
        console.log(chalk_1.default.green.bold('  🎉 מצוין! המסמך עומד בכל הקריטריונים.'));
    }
    else {
        console.log(chalk_1.default.yellow(`  📌 זוהו ${report.gaps.length} פערים לשיפור.`));
    }
    console.log('');
}
function displayLearningUnit(unit, index, total) {
    console.log('');
    printDivider('═');
    console.log('');
    console.log(chalk_1.default.bold.cyan(`  📚 שיעור ${index + 1} מתוך ${total}: ${unit.criterion_question}`));
    console.log('');
    console.log(chalk_1.default.bold.yellow('  🔍 הפער שזוהה:'));
    console.log(`  ${chalk_1.default.white(unit.gap_summary)}`);
    console.log('');
    console.log(chalk_1.default.bold.yellow('  💡 למה זה חשוב?'));
    console.log(`  ${chalk_1.default.white(unit.why_it_matters)}`);
    console.log('');
    console.log(chalk_1.default.bold.yellow('  🛠️  הכלי הפרקטי:'));
    console.log(`  ${chalk_1.default.white(unit.practical_tool)}`);
    if (unit.formula) {
        console.log('');
        console.log(chalk_1.default.bold.yellow('  📐 הנוסחה:'));
        console.log(chalk_1.default.cyan(`  ${unit.formula}`));
    }
    console.log('');
    printDivider('-');
    console.log('');
    console.log(chalk_1.default.bold.red('  ✗ לפני:'));
    console.log(chalk_1.default.gray(`  "${unit.before_from_doc}"`));
    console.log('');
    console.log(chalk_1.default.bold.green('  ✓ אחרי:'));
    console.log(chalk_1.default.white(`  "${unit.after_from_doc}"`));
    console.log('');
}
function displayAssessmentResult(result) {
    console.log('');
    const scoreColor = result.score >= 80
        ? chalk_1.default.green
        : result.score >= 60
            ? chalk_1.default.yellow
            : chalk_1.default.red;
    if (result.passed) {
        console.log(chalk_1.default.green.bold('  ✅ כישור אושר!'));
    }
    else {
        console.log(chalk_1.default.yellow.bold('  🔄 ממשיכים לתרגל...'));
    }
    console.log('');
    console.log(`  ציון: ${scoreColor.bold(`${result.score}/100`)}`);
    console.log('');
    console.log(chalk_1.default.bold('  פידבק:'));
    console.log(`  ${chalk_1.default.white(result.feedback)}`);
    if (result.improvement_tip) {
        console.log('');
        console.log(chalk_1.default.bold.cyan('  💡 טיפ לשיפור:'));
        console.log(`  ${chalk_1.default.cyan(result.improvement_tip)}`);
    }
    console.log('');
}
// ---- Main Flow ----
async function runCoachSession(coach) {
    // 1. Select document type
    const documentTypes = coach.listDocumentTypes();
    const { documentTypeId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'documentTypeId',
            message: 'בחר את סוג המסמך לניתוח:',
            choices: documentTypes.map((dt) => ({
                name: `${dt.name} — ${dt.description.slice(0, 60)}...`,
                value: dt.id,
                short: dt.name,
            })),
        },
    ]);
    // 2. Input document
    console.log('');
    const documentText = await readMultilineInput(`📄 הדבק את ${documentTypes.find((d) => d.id === documentTypeId)?.name ?? 'המסמך'} שלך:`);
    if (documentText.length < 50) {
        console.log(chalk_1.default.red('  הטקסט קצר מדי. נסה שנית עם מסמך מלא.'));
        return;
    }
    // 3. Diagnostic
    console.log('');
    const stopSpinner1 = printSpinner('מנתח את המסמך...');
    let session;
    try {
        session = await coach.runDiagnostic(documentTypeId, documentText);
    }
    finally {
        stopSpinner1();
    }
    displayDiagnosticReport(session.diagnosticReport, session.recipe);
    if (session.diagnosticReport.gaps.length === 0) {
        console.log(chalk_1.default.green('  אין פערים לשיפור — המסמך שלך עומד בכל הסטנדרטים! 🎉'));
        return;
    }
    // 4. Ask if continue to learning
    const { startLearning } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'startLearning',
            message: `האם תרצה ללמוד ולתרגל את ${Math.min(session.diagnosticReport.gaps.length, 3)} הפערים המרכזיים?`,
            default: true,
        },
    ]);
    if (!startLearning)
        return;
    // 5. Generate learning units
    const stopSpinner2 = printSpinner('מכין שיעורים מותאמים אישית...');
    try {
        session = await coach.generateLearning(session, 3);
    }
    finally {
        stopSpinner2();
    }
    // 6. For each learning unit: show lesson, then practice
    for (let i = 0; i < session.learningUnits.length; i++) {
        const unit = session.learningUnits[i];
        displayLearningUnit(unit, i, session.learningUnits.length);
        const { doExercise } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'doExercise',
                message: 'האם תרצה לתרגל כישור זה עכשיו?',
                default: true,
            },
        ]);
        if (!doExercise)
            continue;
        // Generate exercise
        const stopSpinner3 = printSpinner('מכין תרגיל...');
        let exercise;
        try {
            exercise = await coach.generateExercise(session, i);
        }
        finally {
            stopSpinner3();
        }
        console.log('');
        printDivider();
        console.log('');
        console.log(chalk_1.default.bold.white('  ✍️  תרגיל שכתוב:'));
        console.log('');
        console.log(chalk_1.default.bold('  הוראות:'));
        console.log(`  ${chalk_1.default.white(exercise.instruction)}`);
        console.log('');
        console.log(chalk_1.default.bold('  קטע לשכתוב:'));
        console.log(chalk_1.default.gray(`  "${exercise.weak_excerpt}"`));
        console.log('');
        let attempts = 0;
        let passed = false;
        while (!passed && attempts < 3) {
            attempts++;
            const userRewrite = await readMultilineInput(`  השכתוב שלך (ניסיון ${attempts}/3):`);
            if (!userRewrite.trim())
                continue;
            const stopSpinner4 = printSpinner('מעריך את השכתוב...');
            let result;
            try {
                result = await coach.evaluateRewrite(exercise, userRewrite, session, i);
            }
            finally {
                stopSpinner4();
            }
            displayAssessmentResult(result);
            passed = result.passed;
            if (!passed && attempts < 3) {
                const { tryAgain } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'tryAgain',
                        message: 'ננסה שוב?',
                        default: true,
                    },
                ]);
                if (!tryAgain)
                    break;
            }
        }
        if (passed) {
            console.log(chalk_1.default.green.bold(`  🏆 כישור "${unit.criterion_question}" — נסגר בהצלחה!`));
        }
        console.log('');
        if (i < session.learningUnits.length - 1) {
            await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'next',
                    message: 'מוכן לשיעור הבא?',
                    default: true,
                },
            ]);
        }
    }
    // 7. Session summary
    console.log('');
    printDivider('═');
    console.log('');
    console.log(chalk_1.default.bold.blue('  🎓 סיכום אימון'));
    console.log('');
    console.log(`  ניתחת: ${chalk_1.default.bold(session.recipe.name)}`);
    console.log(`  ציון אבחון: ${chalk_1.default.bold(`${session.diagnosticReport.scores.overall}/100`)}`);
    console.log(`  שיעורים שהושלמו: ${chalk_1.default.bold(`${session.learningUnits.length}`)}`);
    console.log('');
    console.log(chalk_1.default.gray('  כדי לראות שיפור — הגש מסמך חדש לאחר שתיישם את מה שלמדת.'));
    console.log('');
    printDivider();
    console.log('');
}
async function main() {
    printHeader();
    const llm = (0, factory_1.createLLMClient)();
    const coach = new coach_1.WritingCoach(llm);
    console.log(chalk_1.default.gray('  ברוך הבא למאמן הכתיבה המנהלית.'));
    console.log(chalk_1.default.gray(`  ספק LLM: ${process.env.LLM_PROVIDER ?? 'anthropic'}`));
    console.log('');
    let continueSession = true;
    while (continueSession) {
        try {
            await runCoachSession(coach);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.log('');
            console.log(chalk_1.default.red(`  שגיאה: ${msg}`));
            console.log('');
        }
        const { another } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'another',
                message: 'האם תרצה לנתח מסמך נוסף?',
                default: false,
            },
        ]);
        continueSession = another;
        if (continueSession) {
            printHeader();
        }
    }
    console.log('');
    console.log(chalk_1.default.blue('  להתראות! המשך כתיבה מוצלחת. ✍️'));
    console.log('');
}
main().catch((err) => {
    console.error(chalk_1.default.red('שגיאה קריטית:'), err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map