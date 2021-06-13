import { Expression } from './expression';
import { Token } from './token';
export interface Visitor<T> {
  visitEmptyStatement(statement: EmptyStatement): T;
  visitExpressionStatement(statement: ExpressionStatement): T;
  visitPrintStatement(statement: PrintStatement): T;
  visitVariableStatement(statement: VariableStatement): T;
}

export abstract class Statement {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class EmptyStatement extends Statement {
  constructor() {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitEmptyStatement(this);
  }
}

export class ExpressionStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitExpressionStatement(this);
  }
}

export class PrintStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitPrintStatement(this);
  }
}

export class VariableStatement extends Statement {
  constructor(public name: Token, public initializer: Expression | null) {
    super();
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVariableStatement(this);
  }
}
