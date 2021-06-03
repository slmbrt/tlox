import {
  BinaryExpression,
  Expression,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
} from './expression';
import { ParseError } from './error';
import { Token, TokenType } from './token';

export class Parser {
  private currentTokenIndex = 0;

  constructor(private tokens: Array<Token>) {}

  public parse(): Expression | null {
    try {
      return this.expression();
    } catch (error: unknown) {
      return null;
    }
  }

  private expression(): Expression {
    return this.equality();
  }

  private equality(): Expression {
    let expression = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  private comparison(): Expression {
    let expression = this.term();

    while (
      this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      const operator = this.previous();
      const right = this.term();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  private term(): Expression {
    let expression = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  private factor(): Expression {
    let expression = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  private unary(): Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpression(operator, right);
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.FALSE)) return new LiteralExpression(false);
    if (this.match(TokenType.TRUE)) return new LiteralExpression(true);
    if (this.match(TokenType.NIL)) return new LiteralExpression(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpression(this.previous().getLiteral());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpression(expression);
    }

    throw this.logError(this.peek(), 'Expression expected');
  }

  private consume(tokenType: TokenType, message: string) {
    if (this.check(tokenType)) return this.advance();

    throw this.logError(this.peek(), message);
  }

  private match(...types: Array<TokenType>): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isCompleted()) return false;

    return this.peek().getType() === type;
  }

  private advance(): Token {
    if (!this.isCompleted()) this.currentTokenIndex++;

    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.currentTokenIndex];
  }

  private previous(): Token {
    return this.tokens[Math.max(0, this.currentTokenIndex - 1)];
  }

  private isCompleted(): boolean {
    return this.peek().getType() == TokenType.EOF;
  }

  private synchronize(): void {
    this.advance();

    while (!this.isCompleted()) {
      const tokenType = this.previous().getType();
      if (tokenType === TokenType.SEMICOLON) return;

      switch (tokenType) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }
    }

    this.advance();
  }

  private logError(token: Token, message: string): ParseError {
    const location = token.getType() === TokenType.EOF ? 'end' : token.getLexeme();
    console.error(`(parser)[line: ${token.getLine()} at ${location}] error: ${message}`);
    return new ParseError();
  }
}
