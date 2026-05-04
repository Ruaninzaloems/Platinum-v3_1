using System.Globalization;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Tiny shunting-yard evaluator for Platinum's Const_MOCDetail Formula
/// expressions, e.g. "OverTimeHour * ((PrevSalary/ WHPM_Monthly) * 1.5)".
/// Supports: + - * /, parentheses, decimal literals, identifiers (resolved
/// via a caller-supplied dictionary). No power operator — none observed in
/// the customer's MOC dataset. Identifier names are case-insensitive.
/// </summary>
public class FormulaEvaluator
{
    public decimal Evaluate(string formula, IReadOnlyDictionary<string, decimal> variables)
    {
        if (string.IsNullOrWhiteSpace(formula))
            throw new InvalidOperationException("Formula is empty.");
        var tokens = Tokenize(formula);
        var rpn = ToRpn(tokens);
        return EvalRpn(rpn, variables);
    }

    // ---------------- Tokenizer ----------------
    private enum TokKind { Number, Ident, Op, LParen, RParen }
    private record struct Tok(TokKind Kind, string Text);

    private static List<Tok> Tokenize(string s)
    {
        var toks = new List<Tok>();
        var i = 0;
        while (i < s.Length)
        {
            var c = s[i];
            if (char.IsWhiteSpace(c)) { i++; continue; }

            if (c == '(') { toks.Add(new Tok(TokKind.LParen, "(")); i++; continue; }
            if (c == ')') { toks.Add(new Tok(TokKind.RParen, ")")); i++; continue; }
            if (c == '+' || c == '-' || c == '*' || c == '/')
            {
                toks.Add(new Tok(TokKind.Op, c.ToString())); i++; continue;
            }

            // Number (digits + optional dot)
            if (char.IsDigit(c) || c == '.')
            {
                var start = i;
                while (i < s.Length && (char.IsDigit(s[i]) || s[i] == '.')) i++;
                toks.Add(new Tok(TokKind.Number, s[start..i]));
                continue;
            }

            // Identifier (letters / digits / underscore — first char must be letter)
            if (char.IsLetter(c) || c == '_')
            {
                var start = i;
                while (i < s.Length && (char.IsLetterOrDigit(s[i]) || s[i] == '_')) i++;
                toks.Add(new Tok(TokKind.Ident, s[start..i]));
                continue;
            }

            throw new InvalidOperationException($"Formula contains unsupported character '{c}'.");
        }
        return toks;
    }

    // ---------------- Shunting-yard ----------------
    private static int Prec(string op) => op switch
    {
        "+" or "-" => 1,
        "*" or "/" => 2,
        _ => 0
    };

    private static List<Tok> ToRpn(List<Tok> tokens)
    {
        var output = new List<Tok>();
        var stack = new Stack<Tok>();
        Tok? prev = null;

        foreach (var t in tokens)
        {
            switch (t.Kind)
            {
                case TokKind.Number:
                case TokKind.Ident:
                    output.Add(t);
                    break;

                case TokKind.Op:
                    // Detect unary +/-. Unary ops are treated as (0 op x) by
                    // injecting a literal 0 onto output.
                    var isUnary = t.Text is "+" or "-" &&
                                  (prev is null
                                   || prev.Value.Kind == TokKind.Op
                                   || prev.Value.Kind == TokKind.LParen);
                    if (isUnary)
                        output.Add(new Tok(TokKind.Number, "0"));

                    while (stack.Count > 0 && stack.Peek().Kind == TokKind.Op
                           && Prec(stack.Peek().Text) >= Prec(t.Text))
                        output.Add(stack.Pop());
                    stack.Push(t);
                    break;

                case TokKind.LParen:
                    stack.Push(t);
                    break;

                case TokKind.RParen:
                    while (stack.Count > 0 && stack.Peek().Kind != TokKind.LParen)
                        output.Add(stack.Pop());
                    if (stack.Count == 0)
                        throw new InvalidOperationException("Formula has mismatched parentheses.");
                    stack.Pop(); // discard '('
                    break;
            }
            prev = t;
        }

        while (stack.Count > 0)
        {
            var top = stack.Pop();
            if (top.Kind is TokKind.LParen or TokKind.RParen)
                throw new InvalidOperationException("Formula has mismatched parentheses.");
            output.Add(top);
        }
        return output;
    }

    // ---------------- Evaluator ----------------
    private static decimal EvalRpn(List<Tok> rpn, IReadOnlyDictionary<string, decimal> vars)
    {
        var stack = new Stack<decimal>();
        // Case-insensitive variable map.
        var ci = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var kv in vars) ci[kv.Key] = kv.Value;

        foreach (var t in rpn)
        {
            switch (t.Kind)
            {
                case TokKind.Number:
                    stack.Push(decimal.Parse(t.Text, CultureInfo.InvariantCulture));
                    break;
                case TokKind.Ident:
                    if (!ci.TryGetValue(t.Text, out var v))
                        throw new InvalidOperationException($"Formula references unknown variable '{t.Text}'.");
                    stack.Push(v);
                    break;
                case TokKind.Op:
                    if (stack.Count < 2)
                        throw new InvalidOperationException("Formula is malformed (missing operand).");
                    var b = stack.Pop();
                    var a = stack.Pop();
                    stack.Push(t.Text switch
                    {
                        "+" => a + b,
                        "-" => a - b,
                        "*" => a * b,
                        "/" => b == 0m
                            ? throw new InvalidOperationException("Formula divides by zero.")
                            : a / b,
                        _ => throw new InvalidOperationException($"Unsupported operator '{t.Text}'.")
                    });
                    break;
            }
        }

        if (stack.Count != 1)
            throw new InvalidOperationException("Formula is malformed (too many operands).");
        return stack.Pop();
    }
}
