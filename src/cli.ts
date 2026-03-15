#!/usr/bin/env ts-node
// ============================================================
// WritingCoach — Interactive CLI
// The user-facing entry point. Guides the user through the
// 3-step learning loop with a rich terminal interface.
// ============================================================

import * as dotenv from 'dotenv';
dotenv.config();

import * as readline from 'readline';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createLLMClient } from './llm/factory';
import { WritingCoach } from './coach';
import type {
  DiagnosticReport,
  LearningUnit,
  PracticeExercise,
  AssessmentResult,
} from './types';
import type { CoachSession } from './coach';

// ---- Helpers ----

function printDivider(char = '─', width = 60): void {
  console.log(chalk.gray(char.repeat(width)));
}

function printHeader(): void {
  console.clear();
  console.log('');
  console.log(chalk.bold.blue('  ✍️  מאמן הכתיבה המנהלית'));
  console.log(chalk.gray('  Personal Administrative Writing Coach'));
  console.log('');
  printDivider('═');
  console.log('');
}

function printScoreBar(label: string, score: number, width = 30): void {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  const color =
    score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const pct = color(`${score}%`);
  console.log(`  ${label.padEnd(22)} ${bar} ${pct}`);
}

async function readMultilineInput(prompt: string): Promise<string> {
  console.log(chalk.cyan(prompt));
  console.log(chalk.gray('(הדבק את הטקסט, לאחר מכן לחץ Enter פעמיים לסיום)'));
  console.log('');

  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    const lines: string[] = [];
    let emptyLineCount = 0;

    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
        } else {
          lines.push(line);
        }
      } else {
        emptyLineCount = 0;
        lines.push(line);
      }
    });

    rl.on('close', () => {
      resolve(lines.join('\n').trim());
    });
  });
}

function printSpinner(text: string): () => void {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r  ${chalk.cyan(frames[i % frames.length])} ${chalk.gray(text)}`);
    i++;
  }, 100);
  return () => {
    clearInterval(timer);
    process.stdout.write('\r' + ' '.repeat(text.length + 6) + '\r');
  };
}

// ---- Display Functions ----

function displayDiagnosticReport(report: DiagnosticReport, recipe: any): void {
  console.log('');
  console.log(chalk.bold.white(`  📊 דו"ח אבחון — ${report.recipe_name}`));
  console.log('');

  // Overall score
  const overallColor =
    report.scores.overall >= 80
      ? chalk.green
      : report.scores.overall >= 60
      ? chalk.yellow
      : chalk.red;
  console.log(`  ציון כולל: ${overallColor.bold(`${report.scores.overall}/100`)}`);
  console.log('');

  // Score bars
  printScoreBar(
    'רובד תשתיתי (שפה)',
    report.scores.foundational.score,
  );
  printScoreBar(
    'רובד ספציפי (מסמך)',
    report.scores.document_specific.score,
  );
  console.log('');
  printDivider();
  console.log('');

  // Detailed results
  console.log(chalk.bold('  פירוט הערכה:'));
  console.log('');

  for (const eval_ of report.evaluations) {
    const criterion = recipe.criteria.find(
      (c: any) => c.id === eval_.criterion_id,
    );
    const icon = eval_.passed ? chalk.green('✓') : chalk.red('✗');
    const label = criterion?.question ?? eval_.criterion_id;
    console.log(`  ${icon} ${chalk.white(label.length > 60 ? label.slice(0, 57) + '...' : label)}`);
    if (!eval_.passed) {
      console.log(`    ${chalk.gray(eval_.explanation)}`);
      if (eval_.excerpt) {
        console.log(`    ${chalk.italic.gray(`"${eval_.excerpt.slice(0, 80)}..."`)}`);
      }
    }
    console.log('');
  }

  // Gap summary
  if (report.gaps.length === 0) {
    console.log(chalk.green.bold('  🎉 מצוין! המסמך עומד בכל הקריטריונים.'));
  } else {
    console.log(
      chalk.yellow(`  📌 זוהו ${report.gaps.length} פערים לשיפור.`),
    );
  }
  console.log('');
}

function displayLearningUnit(
  unit: LearningUnit,
  index: number,
  total: number,
): void {
  console.log('');
  printDivider('═');
  console.log('');
  console.log(
    chalk.bold.cyan(`  📚 שיעור ${index + 1} מתוך ${total}: ${unit.criterion_question}`),
  );
  console.log('');

  console.log(chalk.bold.yellow('  🔍 הפער שזוהה:'));
  console.log(`  ${chalk.white(unit.gap_summary)}`);
  console.log('');

  console.log(chalk.bold.yellow('  💡 למה זה חשוב?'));
  console.log(`  ${chalk.white(unit.why_it_matters)}`);
  console.log('');

  console.log(chalk.bold.yellow('  🛠️  הכלי הפרקטי:'));
  console.log(`  ${chalk.white(unit.practical_tool)}`);
  if (unit.formula) {
    console.log('');
    console.log(chalk.bold.yellow('  📐 הנוסחה:'));
    console.log(chalk.cyan(`  ${unit.formula}`));
  }
  console.log('');

  printDivider('-');
  console.log('');
  console.log(chalk.bold.red('  ✗ לפני:'));
  console.log(chalk.gray(`  "${unit.before_from_doc}"`));
  console.log('');
  console.log(chalk.bold.green('  ✓ אחרי:'));
  console.log(chalk.white(`  "${unit.after_from_doc}"`));
  console.log('');
}

function displayAssessmentResult(result: AssessmentResult): void {
  console.log('');
  const scoreColor =
    result.score >= 80
      ? chalk.green
      : result.score >= 60
      ? chalk.yellow
      : chalk.red;

  if (result.passed) {
    console.log(chalk.green.bold('  ✅ כישור אושר!'));
  } else {
    console.log(chalk.yellow.bold('  🔄 ממשיכים לתרגל...'));
  }

  console.log('');
  console.log(`  ציון: ${scoreColor.bold(`${result.score}/100`)}`);
  console.log('');
  console.log(chalk.bold('  פידבק:'));
  console.log(`  ${chalk.white(result.feedback)}`);

  if (result.improvement_tip) {
    console.log('');
    console.log(chalk.bold.cyan('  💡 טיפ לשיפור:'));
    console.log(`  ${chalk.cyan(result.improvement_tip)}`);
  }
  console.log('');
}

// ---- Main Flow ----

async function runCoachSession(coach: WritingCoach): Promise<void> {
  // 1. Select document type
  const documentTypes = coach.listDocumentTypes();
  const { documentTypeId } = await inquirer.prompt([
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
  const documentText = await readMultilineInput(
    `📄 הדבק את ${documentTypes.find((d) => d.id === documentTypeId)?.name ?? 'המסמך'} שלך:`,
  );

  if (documentText.length < 50) {
    console.log(chalk.red('  הטקסט קצר מדי. נסה שנית עם מסמך מלא.'));
    return;
  }

  // 3. Diagnostic
  console.log('');
  const stopSpinner1 = printSpinner('מנתח את המסמך...');
  let session: CoachSession;
  try {
    session = await coach.runDiagnostic(documentTypeId, documentText);
  } finally {
    stopSpinner1();
  }

  displayDiagnosticReport(session.diagnosticReport, session.recipe);

  if (session.diagnosticReport.gaps.length === 0) {
    console.log(
      chalk.green('  אין פערים לשיפור — המסמך שלך עומד בכל הסטנדרטים! 🎉'),
    );
    return;
  }

  // 4. Ask if continue to learning
  const { startLearning } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startLearning',
      message: `האם תרצה ללמוד ולתרגל את ${Math.min(session.diagnosticReport.gaps.length, 3)} הפערים המרכזיים?`,
      default: true,
    },
  ]);

  if (!startLearning) return;

  // 5. Generate learning units
  const stopSpinner2 = printSpinner('מכין שיעורים מותאמים אישית...');
  try {
    session = await coach.generateLearning(session, 3);
  } finally {
    stopSpinner2();
  }

  // 6. For each learning unit: show lesson, then practice
  for (let i = 0; i < session.learningUnits.length; i++) {
    const unit = session.learningUnits[i];
    displayLearningUnit(unit, i, session.learningUnits.length);

    const { doExercise } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doExercise',
        message: 'האם תרצה לתרגל כישור זה עכשיו?',
        default: true,
      },
    ]);

    if (!doExercise) continue;

    // Generate exercise
    const stopSpinner3 = printSpinner('מכין תרגיל...');
    let exercise: PracticeExercise;
    try {
      exercise = await coach.generateExercise(session, i);
    } finally {
      stopSpinner3();
    }

    console.log('');
    printDivider();
    console.log('');
    console.log(chalk.bold.white('  ✍️  תרגיל שכתוב:'));
    console.log('');
    console.log(chalk.bold('  הוראות:'));
    console.log(`  ${chalk.white(exercise.instruction)}`);
    console.log('');
    console.log(chalk.bold('  קטע לשכתוב:'));
    console.log(chalk.gray(`  "${exercise.weak_excerpt}"`));
    console.log('');

    let attempts = 0;
    let passed = false;

    while (!passed && attempts < 3) {
      attempts++;
      const userRewrite = await readMultilineInput(
        `  השכתוב שלך (ניסיון ${attempts}/3):`,
      );

      if (!userRewrite.trim()) continue;

      const stopSpinner4 = printSpinner('מעריך את השכתוב...');
      let result: AssessmentResult;
      try {
        result = await coach.evaluateRewrite(exercise, userRewrite, session, i);
      } finally {
        stopSpinner4();
      }

      displayAssessmentResult(result);
      passed = result.passed;

      if (!passed && attempts < 3) {
        const { tryAgain } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'tryAgain',
            message: 'ננסה שוב?',
            default: true,
          },
        ]);
        if (!tryAgain) break;
      }
    }

    if (passed) {
      console.log(chalk.green.bold(`  🏆 כישור "${unit.criterion_question}" — נסגר בהצלחה!`));
    }

    console.log('');
    if (i < session.learningUnits.length - 1) {
      await inquirer.prompt([
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
  console.log(chalk.bold.blue('  🎓 סיכום אימון'));
  console.log('');
  console.log(
    `  ניתחת: ${chalk.bold(session.recipe.name)}`,
  );
  console.log(
    `  ציון אבחון: ${chalk.bold(`${session.diagnosticReport.scores.overall}/100`)}`,
  );
  console.log(
    `  שיעורים שהושלמו: ${chalk.bold(`${session.learningUnits.length}`)}`,
  );
  console.log('');
  console.log(chalk.gray('  כדי לראות שיפור — הגש מסמך חדש לאחר שתיישם את מה שלמדת.'));
  console.log('');
  printDivider();
  console.log('');
}

async function main(): Promise<void> {
  printHeader();

  const llm = createLLMClient();
  const coach = new WritingCoach(llm);

  console.log(
    chalk.gray('  ברוך הבא למאמן הכתיבה המנהלית.'),
  );
  console.log(
    chalk.gray(`  ספק LLM: ${process.env.LLM_PROVIDER ?? 'anthropic'}`),
  );
  console.log('');

  let continueSession = true;

  while (continueSession) {
    try {
      await runCoachSession(coach);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log('');
      console.log(chalk.red(`  שגיאה: ${msg}`));
      console.log('');
    }

    const { another } = await inquirer.prompt([
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
  console.log(chalk.blue('  להתראות! המשך כתיבה מוצלחת. ✍️'));
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red('שגיאה קריטית:'), err);
  process.exit(1);
});
