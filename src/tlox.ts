import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { AstPrinter } from './astprinter';
import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { Parser } from './parser';
import { Scanner } from './scanner';

enum ErrorCode {
  NO_ERROR,
  BAD_USAGE,
  INVALID_FILE,
  SCANNER_ERROR,
  PARSER_ERROR,
  RUNTIME_ERROR,
}

const runFile = (filePath: string) => {
  try {
    const result = run(readFileSync(filePath, 'utf8'));
    if (result !== ErrorCode.NO_ERROR) process.exit(result);
  } catch (error) {
    console.error(error);
    process.exit(ErrorCode.INVALID_FILE);
  }
};

const runPrompt = () => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptEnvironment = new Environment();

  rl.on('line', (line: string) => {
    run(line, promptEnvironment);
    rl.prompt();
  });

  rl.setPrompt('> ');
  rl.prompt();
};

const run = (source: string, environment: Environment | null = null): ErrorCode => {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  if (scanner.hadError) return ErrorCode.SCANNER_ERROR;

  const parser = new Parser(tokens);
  const statements = parser.parse();
  if (parser.hadError) return ErrorCode.PARSER_ERROR;

  //todosam: command-line argument to dump AST?
  // const astPrinter = new AstPrinter();
  // astPrinter.print(statements);

  const interpreter = environment ? new Interpreter(environment) : new Interpreter();
  if (!interpreter.interpret(statements)) return ErrorCode.RUNTIME_ERROR;

  return ErrorCode.NO_ERROR;
};

const commandLineArguments = process.argv.slice(2);

if (commandLineArguments.length > 1) {
  console.error('Usage: tlox [file]');
  process.exit(ErrorCode.BAD_USAGE);
} else if (commandLineArguments.length === 1) {
  runFile(process.argv[2]);
} else {
  runPrompt();
}
