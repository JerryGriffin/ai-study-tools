"""Deterministic answer normalisation and verification for K12 homework.

The core idea: never trust a single model output.  Normalise every candidate
answer, compare candidates with SymPy, and run independent checks directly from
the question (solve equations, evaluate expressions, differentiate, integrate).
When a deterministic check disagrees, the answer is marked as disputed instead
of being presented as certain.
"""

from __future__ import annotations

import math
import random
import re
from dataclasses import dataclass, field
from typing import Any

import sympy as sp
from sympy.core.relational import Eq, Ge, Gt, Le, Lt, Ne
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)
from sympy.solvers.inequalities import solve_univariate_inequality

X, Y, Z, T, N, K = sp.symbols("x y z t n k")
A, B, C, M, P, Q, R, U, V = sp.symbols("a b c m p q r u v")

TRANSFORMS = standard_transformations + (convert_xor, implicit_multiplication_application)

SAFE_GLOBALS = {
    "Symbol": sp.Symbol,
    "Integer": sp.Integer,
    "Float": sp.Float,
    "Rational": sp.Rational,
    "pi": sp.pi,
    "E": sp.E,
    "I": sp.I,
    "oo": sp.oo,
    "zoo": sp.zoo,
    "sqrt": sp.sqrt,
    "Abs": sp.Abs,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "cot": sp.cot,
    "sec": sp.sec,
    "csc": sp.csc,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "factorial": sp.factorial,
    "binomial": sp.binomial,
    "gcd": sp.gcd,
    "lcm": sp.lcm,
    "Max": sp.Max,
    "Min": sp.Min,
    "Piecewise": sp.Piecewise,
}

SAFE_LOCALS = {
    "x": X, "y": Y, "z": Z, "t": T, "n": N, "k": K,
    "a": A, "b": B, "c": C, "m": M, "p": P, "q": Q,
    "r": R, "u": U, "v": V,
}

FORBIDDEN = re.compile(
    r"(__|\b(?:import|open|eval|exec|lambda|os|sys|getattr|setattr|compile|"
    r"globals|locals|input|print|class|def|while|for|with)\b)",
    re.IGNORECASE,
)

ANSWER_TYPES = {"number", "expression", "equation", "interval", "set", "choice", "text", "proof", "tuple"}


@dataclass
class NormalizedAnswer:
    raw: str
    kind: str
    value: Any = None
    display: str = ""
    error: str | None = None
    detail: str = ""

    def public(self) -> dict:
        return {
            "raw": self.raw,
            "kind": self.kind,
            "display": self.display or self.raw,
            "error": self.error,
            "detail": self.detail,
        }


# ---------------------------------------------------------------------------
# LaTeX / unicode cleanup


def _read_group(source: str, index: int) -> tuple[str, int]:
    if index >= len(source):
        return "", index
    if source[index] == "{":
        depth = 0
        for i in range(index, len(source)):
            if source[i] == "{":
                depth += 1
            elif source[i] == "}":
                depth -= 1
                if depth == 0:
                    return source[index + 1 : i], i + 1
        return source[index + 1 :], len(source)
    if source[index] == "\\":
        match = re.match(r"\\[a-zA-Z]+", source[index:])
        if match:
            return source[index : index + match.end()], index + match.end()
        return source[index : index + 2], index + 2
    return source[index], index + 1


def _replace_frac(source: str) -> str:
    index = source.find("\\frac")
    if index < 0:
        return source
    numerator, cursor = _read_group(source, index + 5)
    denominator, cursor = _read_group(source, cursor)
    return source[:index] + "(" + numerator + ")/(" + denominator + ")" + source[cursor:]


def _replace_sqrt(source: str) -> str:
    index = source.find("\\sqrt")
    if index < 0:
        return source
    cursor = index + 5
    root = None
    if cursor < len(source) and source[cursor] == "[":
        end = source.find("]", cursor)
        if end >= 0:
            root = source[cursor + 1 : end]
            cursor = end + 1
    body, cursor = _read_group(source, cursor)
    if root:
        replacement = "(" + body + ")**(1/(" + root + "))"
    else:
        replacement = "sqrt(" + body + ")"
    return source[:index] + replacement + source[cursor:]


def latex_to_plain(source: str) -> str:
    """Convert common LaTeX into a SymPy-friendly plain-text expression."""
    s = str(source or "")
    s = s.replace("\\\\", "\\")
    s = s.replace("$", "").replace("\\(", "").replace("\\)", "").replace("\\[", "").replace("\\]", "")
    s = s.replace("\\left", "").replace("\\right", "")
    s = s.replace("\\displaystyle", "").replace("\\limits", "")
    s = re.sub(r"\\[,;!]", "", s)
    s = re.sub(r"\\quad|\\qquad|\\ ", " ", s)
    s = re.sub(r"\\(?:text|mathrm|mathbf|operatorname)\{([^{}]*)\}", r"\1", s)
    s = re.sub(r"\\text\{.*?\}", "", s)
    s = s.replace("\\dfrac", "\\frac").replace("\\tfrac", "\\frac")
    s = s.replace("\\cdot", "*").replace("\\times", "*").replace("\\div", "/")
    s = s.replace("\\pi", "pi").replace("\\infty", "oo")
    s = s.replace("\\leq", "<=").replace("\\le", "<=")
    s = s.replace("\\geq", ">=").replace("\\ge", ">=")
    s = s.replace("\\neq", "!=").replace("\\ne", "!=")
    s = s.replace("\\pm", "±").replace("\\mp", "∓")
    s = s.replace("\\%", "/100").replace("\\angle", "")
    s = s.replace("\\ln", "log").replace("\\log", "log")
    s = s.replace("\\cup", "∪").replace("\\cap", "∩")
    s = s.replace("\\in", " in ").replace("\\notin", " notin ")
    s = s.replace("\\to", "->")

    # log base: \log_{2}{8} -> log(8, 2)
    s = re.sub(r"\\log_\{?([^{}]+?)\}?\s*\{([^{}]+)\}", r"log(\2,\1)", s)
    s = re.sub(r"log_\{?([0-9a-zA-Z]+)\}?\s*([0-9a-zA-Z]+)", r"log(\2,\1)", s)

    for _ in range(30):
        before = s
        s = _replace_frac(s)
        s = _replace_sqrt(s)
        if s == before:
            break

    s = re.sub(r"\^\{([^{}]+)\}", r"^(\1)", s)
    s = re.sub(r"_\{([^{}]+)\}", r"\1", s)
    s = s.replace("{", "(").replace("}", ")")
    s = s.replace("²", "**2").replace("³", "**3").replace("⁴", "**4")
    s = s.replace("¹", "**1")
    s = s.replace("×", "*").replace("·", "*").replace("÷", "/")
    s = s.replace("−", "-").replace("–", "-").replace("—", "-")
    s = s.replace("≤", "<=").replace("≥", ">=").replace("≠", "!=")
    s = s.replace("π", "pi").replace("∞", "oo")
    s = s.replace("（", "(").replace("）", ")").replace("，", ",").replace("；", ";")
    s = re.sub(r"(\d+(?:\.\d+)?)\s*°", r"(\1*pi/180)", s)
    s = re.sub(r"√\s*\(([^()]*)\)", r"sqrt(\1)", s)
    s = re.sub(r"√\s*([0-9]+(?:\.[0-9]+)?)", r"sqrt(\1)", s)
    s = re.sub(r"√\s*([a-zA-Z])", r"sqrt(\1)", s)
    s = s.replace("√", "sqrt")
    s = re.sub(r"(?<=[0-9A-Za-z])\s*sqrt\(", "*sqrt(", s)
    # OCR often inserts a space between every Chinese character.  Collapse the
    # spaces so keyword-based checks such as 解方程 still match.
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def strip_answer_prefix(source: str) -> str:
    s = str(source or "").strip()
    s = re.sub(r"^\s*(?:最终答案|答案|答|解|所以|故|因此)\s*[:：]?\s*", "", s)
    s = re.sub(r"^\s*(?:x|y|z)\s*[:：]\s*", "", s)
    # Derivative answers are often written as f'(x)=... or dy/dx=...
    s = re.sub(r"^\s*(?:f\s*['′]\s*\(\s*x\s*\)|y\s*['′]|\\frac\{dy\}\{dx\})\s*=\s*", "", s)
    s = re.sub(r"^\s*(?:\(?dy\)?\s*/\s*\(?dx\)?)\s*=\s*", "", s)
    s = s.strip().strip("。；;")
    return s


def _split_top_level(source: str, separators: str = ",") -> list[str]:
    parts: list[str] = []
    depth = 0
    current: list[str] = []
    for char in source:
        if char in "([{":
            depth += 1
        elif char in ")]}":
            depth -= 1
        if char in separators and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    if current:
        parts.append("".join(current).strip())
    return [p for p in parts if p]


def safe_parse(source: str, local: dict | None = None):
    text = latex_to_plain(source).strip()
    if not text or len(text) > 500:
        raise ValueError("表达式为空或过长")
    if FORBIDDEN.search(text):
        raise ValueError("表达式包含不允许的内容")
    locals_ = dict(SAFE_LOCALS)
    if local:
        locals_.update(local)
    return parse_expr(
        text,
        local_dict=locals_,
        global_dict=SAFE_GLOBALS,
        transformations=TRANSFORMS,
        evaluate=True,
    )


# ---------------------------------------------------------------------------
# Normalisation


def _detect_kind(raw: str, text: str, declared: str | None) -> str:
    if declared in ANSWER_TYPES:
        return declared
    clean = text.strip()
    if "证明" in raw and ("证明" in raw[:8] or "求证" in raw[:8]):
        return "proof"
    if re.fullmatch(r"[A-Da-d]", clean):
        return "choice"
    if re.match(r"^(选|答案[:：]?)\s*[A-Da-d]$", clean):
        return "choice"
    if re.match(r"^[\[\(].*[,，].*[\]\)]$", clean) or "∪" in clean:
        return "interval"
    if clean.startswith("{") and clean.endswith("}"):
        return "set"
    if re.search(r"(^|[,;])\s*[a-zA-Z]\s*=", clean) or re.match(r"^[a-zA-Z]\s*=", clean):
        return "equation"
    if re.search(r"[<>]=?|[<>]", clean) and re.search(r"[a-zA-Z]", clean):
        return "interval"
    try:
        value = safe_parse(clean)
        if value.is_number:
            return "number"
        return "expression"
    except Exception:
        return "text"


def _parse_number(value) -> sp.Expr:
    return sp.simplify(value)


def _parse_interval(text: str) -> sp.Set | None:
    s = text.replace(" ", "")
    s = re.sub(r"^(?:x|y|z)(?:∈|in|:)", "", s)
    s = s.replace("+oo", "oo").replace("-∞", "-oo").replace("∞", "oo")

    compound = re.match(r"^(.+?)(<=|<|≤)([a-zA-Z])(<=|<|≤)(.+)$", s)
    if compound:
        lower_text, left_op, variable, right_op, upper_text = compound.groups()
        try:
            lower = safe_parse(lower_text)
            upper = safe_parse(upper_text)
            return sp.Interval(
                lower,
                upper,
                left_open=(left_op == "<"),
                right_open=(right_op == "<"),
            )
        except Exception:
            return None

    union_parts = s.split("∪")
    intervals = []
    for part in union_parts:
        match = re.match(r"^([\[\(])(.+?),(.+?)([\]\)])$", part)
        if not match:
            return None
        left_bracket, left, right, right_bracket = match.groups()
        try:
            left_value = -sp.oo if left in ("-oo", "−oo") else sp.oo if left == "oo" else safe_parse(left)
            right_value = sp.oo if right == "oo" else -sp.oo if right in ("-oo", "−oo") else safe_parse(right)
            intervals.append(
                sp.Interval(
                    left_value,
                    right_value,
                    left_open=(left_bracket == "("),
                    right_open=(right_bracket == ")"),
                )
            )
        except Exception:
            return None
    return sp.Union(*intervals) if len(intervals) > 1 else intervals[0]


def _parse_set(text: str) -> sp.Set | None:
    s = text.strip()
    if not (s.startswith("{") and s.endswith("}")):
        return None
    inner = s[1:-1].strip()
    if not inner:
        return sp.EmptySet
    if "|" in inner or ":" in inner:
        return None
    parts = _split_top_level(inner, ",，")
    values = []
    for part in parts:
        try:
            values.append(safe_parse(part))
        except Exception:
            return None
    return sp.FiniteSet(*values)


def _parse_equation_set(text: str) -> sp.Set | None:
    s = text.replace("或", ",").replace("、", ",").replace("，", ",")
    parts = _split_top_level(s, ",")
    values = []
    variable = None
    for part in parts:
        part = part.strip()
        if not part:
            continue
        match = re.match(r"^([a-zA-Z])\s*=\s*(.+)$", part)
        if match:
            variable = match.group(1)
            rhs = match.group(2).strip()
            if "±" in rhs or "∓" in rhs:
                for sign in ("+", "-"):
                    try:
                        values.append(safe_parse(rhs.replace("±", sign).replace("∓", "+" if sign == "-" else "-")))
                    except Exception:
                        return None
            else:
                try:
                    values.append(safe_parse(rhs))
                except Exception:
                    return None
        elif variable:
            # x=2, 3  /  x=2, x=3
            try:
                values.append(safe_parse(part))
            except Exception:
                return None
        else:
            return None
    return sp.FiniteSet(*values) if values else None


def normalize_answer(raw: str, declared_kind: str | None = None) -> NormalizedAnswer:
    original = str(raw or "").strip()

    # Preserve explicit set notation before braces are turned into grouping
    # parentheses by the LaTeX cleaner.
    set_candidate = original.replace("\\left", "").replace("\\right", "").strip()
    set_candidate = set_candidate.replace("\\{", "{").replace("\\}", "}")
    if set_candidate.startswith("{") and set_candidate.endswith("}"):
        inner = set_candidate[1:-1].strip()
        if inner and "|" not in inner and ":" not in inner:
            parts = _split_top_level(inner, ",，")
            values = []
            for part in parts:
                try:
                    values.append(safe_parse(part))
                except Exception:
                    values = []
                    break
            if values:
                value = sp.FiniteSet(*values)
                return NormalizedAnswer(original, "set", value, original, detail=str(value))

    text = strip_answer_prefix(latex_to_plain(original))
    if not text:
        return NormalizedAnswer(original, "text", None, original, "答案为空")

    # The model may label a set or equation incorrectly.  If the declared
    # shape does not fit the actual answer, fall back to heuristics.
    if declared_kind == "set" and not text.strip().startswith("{"):
        declared_kind = None
    if declared_kind == "equation" and "=" not in text:
        declared_kind = None
    if declared_kind == "interval" and not re.search(r"[\[\]()<>≤≥]|oo|∞", text):
        declared_kind = None
    if declared_kind in ("number", "expression") and re.search(r"[<>≤≥]|[a-zA-Z]\s*=", text):
        declared_kind = None

    kind = _detect_kind(original, text, declared_kind)

    try:
        if kind == "proof":
            return NormalizedAnswer(original, "proof", text, original, detail="证明题")

        if kind == "choice":
            letter_match = re.search(r"[A-Da-d]", text)
            if not letter_match:
                return NormalizedAnswer(original, "choice", None, original, "未识别选项")
            letter = letter_match.group(0).upper()
            return NormalizedAnswer(original, "choice", letter, original, detail="选项 " + letter)

        if kind == "interval":
            interval = _parse_interval(text)
            if interval is not None:
                return NormalizedAnswer(original, "interval", interval, original, detail=str(interval))
            # A plain inequality as the final answer, e.g. x < 3.
            relation = _parse_relation(text)
            if relation is not None:
                symbol = next(iter(relation.free_symbols), X)
                try:
                    solution = solve_univariate_inequality(relation, symbol, relational=False)
                    return NormalizedAnswer(original, "interval", solution, original, detail=str(solution))
                except Exception:
                    pass
            raise ValueError("无法解析区间")

        if kind == "set":
            value = _parse_set(text)
            if value is None:
                raise ValueError("无法解析集合")
            return NormalizedAnswer(original, "set", value, original, detail=str(value))

        if kind == "equation":
            if "±" in text or "∓" in text:
                values = []
                for sign in ("+", "-"):
                    candidate = text.replace("±", sign).replace("∓", "+" if sign == "-" else "-")
                    parsed = _parse_equation_set(candidate)
                    if parsed is None:
                        break
                    values.extend(list(parsed))
                if values:
                    return NormalizedAnswer(original, "equation", sp.FiniteSet(*values), original, detail=str(sp.FiniteSet(*values)))
            value = _parse_equation_set(text)
            if value is None:
                raise ValueError("无法解析方程的解")
            return NormalizedAnswer(original, "equation", value, original, detail=str(value))

        if kind == "number":
            value = _parse_number(safe_parse(text))
            if not value.is_number:
                raise ValueError("不是数值")
            return NormalizedAnswer(original, "number", value, original, detail=str(value))

        if kind == "expression":
            value = sp.simplify(safe_parse(text))
            return NormalizedAnswer(original, "expression", value, original, detail=str(value))

        # Fallback: try a number/expression before giving up.
        try:
            value = sp.simplify(safe_parse(text))
            return NormalizedAnswer(
                original,
                "number" if value.is_number else "expression",
                value,
                original,
                detail=str(value),
            )
        except Exception:
            pass

        return NormalizedAnswer(original, "text", re.sub(r"\s+", "", text).lower(), original)
    except Exception as exc:  # noqa: BLE001
        if declared_kind:
            fallback = normalize_answer(original, None)
            if not fallback.error:
                return fallback
        return NormalizedAnswer(original, kind, None, original, str(exc))


# ---------------------------------------------------------------------------
# Equivalence


def _as_finite_set(value) -> sp.Set:
    if isinstance(value, sp.Set):
        return value
    if isinstance(value, (list, tuple, set)):
        return sp.FiniteSet(*value)
    return sp.FiniteSet(value)


def _numbers_equal(a, b) -> bool:
    try:
        difference = sp.simplify(a - b)
        if difference == 0:
            return True
        if difference.is_number:
            return abs(complex(sp.N(difference))) <= 1e-9 * (1 + abs(complex(sp.N(a))) + abs(complex(sp.N(b))))
    except Exception:
        pass
    return False


def _expressions_equal(a, b) -> bool:
    if a == b:
        return True
    try:
        if sp.simplify(a - b) == 0:
            return True
    except Exception:
        pass

    symbols = sorted(a.free_symbols | b.free_symbols, key=str)
    if len(symbols) > 3:
        return False
    valid = 0
    for _ in range(12):
        substitutions = {
            symbol: sp.Rational(random.randint(1, 7), random.randint(1, 5))
            for symbol in symbols
        }
        try:
            left = complex(sp.N(a.subs(substitutions)))
            right = complex(sp.N(b.subs(substitutions)))
            if not (math.isfinite(left.real) and math.isfinite(left.imag) and math.isfinite(right.real) and math.isfinite(right.imag)):
                continue
            valid += 1
            scale = 1 + abs(left) + abs(right)
            if abs(left - right) > 1e-7 * scale:
                return False
        except Exception:
            continue
    return valid > 0


def answers_equivalent(left: NormalizedAnswer, right: NormalizedAnswer) -> bool:
    if left.error or right.error:
        return _text_equal(left, right)
    if left.kind == "choice" or right.kind == "choice":
        return str(left.value).upper() == str(right.value).upper()
    if left.kind in ("proof", "text") or right.kind in ("proof", "text"):
        return _text_equal(left, right)

    if left.kind in ("equation", "set", "interval") or right.kind in ("equation", "set", "interval"):
        try:
            left_set = _as_finite_set(left.value)
            right_set = _as_finite_set(right.value)
            if left_set == right_set:
                return True
            if isinstance(left_set, sp.Set) and isinstance(right_set, sp.Set):
                difference = left_set.symmetric_difference(right_set)
                if difference == sp.EmptySet:
                    return True

            # "x=4" and "4" describe the same single value.
            if isinstance(left_set, sp.FiniteSet) and len(left_set) == 1 and right.kind in ("number", "expression"):
                element = next(iter(left_set))
                return _expressions_equal(element, right.value)
            if isinstance(right_set, sp.FiniteSet) and len(right_set) == 1 and left.kind in ("number", "expression"):
                element = next(iter(right_set))
                return _expressions_equal(left.value, element)
        except Exception:
            pass

    if left.kind == "number" and right.kind == "number":
        return _numbers_equal(left.value, right.value)
    if left.kind in ("number", "expression") and right.kind in ("number", "expression"):
        return _expressions_equal(left.value, right.value)
    return _text_equal(left, right)


def _text_equal(left: NormalizedAnswer, right: NormalizedAnswer) -> bool:
    def clean(answer: NormalizedAnswer) -> str:
        value = answer.value if isinstance(answer.value, str) else answer.display
        return re.sub(r"[\s$。；;，,、:：()（）]", "", str(value or "")).lower()

    return clean(left) == clean(right)


def describe_answer(answer: NormalizedAnswer) -> str:
    if answer.error:
        return answer.raw
    if answer.kind == "choice":
        return "选项 " + str(answer.value)
    if answer.kind in ("equation", "set", "interval"):
        return str(answer.value)
    if answer.kind in ("number", "expression"):
        return str(answer.value)
    return answer.raw


# ---------------------------------------------------------------------------
# Relation / expression helpers


def _parse_relation(source: str):
    s = source.strip()
    for operator, relation in (
        ("<=", Le),
        (">=", Ge),
        ("!=", Ne),
        ("<", Lt),
        (">", Gt),
        ("=", Eq),
    ):
        if operator in s:
            left, right = s.split(operator, 1)
            left, right = left.strip(), right.strip()
            if not left or not right:
                continue
            try:
                return relation(safe_parse(left), safe_parse(right))
            except Exception:
                continue
    return None


def _extract_relation_text(question: str) -> str | None:
    text = latex_to_plain(question)
    text = re.sub(r"(\b[A-D])\s*[.、:：].*", " ", text)
    # Prefer the part after explicit keywords.
    match = re.search(
        r"(?:解方程|解不等式|方程组|方程|不等式)\s*[:：]?\s*(.+)$",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        candidate = match.group(1)
        candidate = re.split(r"(?:[。；;]|，求|，则|，那|\(1\)|（1）)", candidate)[0]
        # Recognised photo text often puts the next sentence on the same line,
        # e.g. "2x+5=13 求 x 的值".  Keep only the leading math fragment.
        candidate = re.split(r"[\r\n]|[\u4e00-\u9fff]", candidate)[0]
        if any(op in candidate for op in ("=", "<", ">")):
            return candidate.strip()

    # Otherwise take the first math-looking relation in the question.
    pattern = re.compile(r"[0-9a-zA-ZxXyYzZtT\+\-\*/\^\(\)\.\s<>＝=]{3,}")
    for match in pattern.finditer(text):
        candidate = match.group(0).strip()
        if any(op in candidate for op in ("=", "<", ">")) and re.search(r"[a-zA-Z]", candidate):
            # Avoid "f(x)=..." when the question asks for f(3); that is a definition.
            if re.search(r"f\s*\(\s*x\s*\)\s*=", candidate, re.IGNORECASE):
                continue
            return candidate
    return None


def _extract_expression_after_keyword(question: str) -> str | None:
    text = latex_to_plain(question)
    match = re.search(
        r"(?:计算|求值|化简|求代数式的值|求下列各式的值)\s*[:：]?\s*(.+)$",
        text,
    )
    if not match:
        return None
    candidate = match.group(1)
    candidate = re.split(r"(?:[。；;]|，其中|，求|，则|\(1\)|（1）)", candidate)[0]
    return candidate.strip() or None


def _extract_function(question: str):
    text = latex_to_plain(question)
    match = re.search(r"f\s*\(\s*x\s*\)\s*=\s*([0-9a-zA-ZxXyY\+\-\*/\^\(\)\.\s]+)", text)
    if not match:
        match = re.search(r"y\s*=\s*([0-9a-zA-ZxXyY\+\-\*/\^\(\)\.\s]+)", text)
        if match and "函数" not in question:
            return None
    if not match:
        return None
    body = match.group(1).strip()
    try:
        return safe_parse(body)
    except Exception:
        return None


def _extract_function_point(question: str):
    text = latex_to_plain(question)
    match = re.search(r"f\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)", text)
    if match:
        return safe_parse(match.group(1))
    return None


# ---------------------------------------------------------------------------
# Checks


def _check(name: str, status: str, detail: str, strength: str = "strong") -> dict:
    return {"name": name, "status": status, "detail": detail, "strength": strength}


def check_equation(question: str, answer: NormalizedAnswer) -> dict | None:
    text = latex_to_plain(question)
    if not re.search(r"方程|不等式|解集", text):
        return None
    relation_text = _extract_relation_text(question)
    if not relation_text:
        return _check("方程/不等式独立求解", "skip", "未能从题目中提取关系式", "weak")
    relation = _parse_relation(relation_text)
    if relation is None:
        return _check("方程/不等式独立求解", "skip", "关系式解析失败", "weak")

    symbols = sorted(relation.free_symbols, key=str)
    if len(symbols) != 1:
        return _check("方程/不等式独立求解", "skip", "暂不校验多变量方程", "weak")
    symbol = symbols[0]

    try:
        if isinstance(relation, (Lt, Le, Gt, Ge, Ne)):
            solution = solve_univariate_inequality(relation, symbol, relational=False)
            detail = f"独立解集：{solution}"
        else:
            roots = sp.solve(relation, symbol)
            solution = sp.FiniteSet(*roots) if roots else sp.EmptySet
            detail = f"独立解得：{symbol} ∈ {solution}"
    except Exception as exc:  # noqa: BLE001
        return _check("方程/不等式独立求解", "skip", f"独立求解失败：{exc}", "weak")

    expected = NormalizedAnswer(str(solution), "equation" if not isinstance(solution, sp.Set) else "set", solution)
    if isinstance(solution, sp.Set) and not isinstance(solution, sp.FiniteSet):
        expected.kind = "interval"
    if isinstance(answer.value, sp.Set):
        equal = answers_equivalent(expected, answer)
    else:
        equal = False
    if equal:
        return _check("方程/不等式独立求解", "pass", detail)
    return _check("方程/不等式独立求解", "fail", detail + f"；模型答案：{describe_answer(answer)}")


def check_expression(question: str, answer: NormalizedAnswer) -> dict | None:
    plain_question = latex_to_plain(question)
    if "∫" in plain_question or "积分" in plain_question:
        return None
    expression_text = _extract_expression_after_keyword(question)
    if not expression_text:
        # A bare expression like "(-3)^2 - 2×(-4)" is also verifiable.
        plain = latex_to_plain(question).strip()
        if re.fullmatch(r"[0-9a-zA-ZxXyY\+\-\*/\^\(\)\.\s]+", plain) and any(op in plain for op in ("+", "-", "*", "/", "^")):
            expression_text = plain
        else:
            return None
    if "=" in expression_text or any(token in expression_text for token in ("则", "求", "答")):
        return None

    try:
        expression = safe_parse(expression_text)
    except Exception:
        return _check("表达式独立计算", "skip", "表达式解析失败", "weak")

    substitutions = {}
    for symbol_name, symbol in (("x", X), ("y", Y), ("z", Z)):
        match = re.search(rf"{symbol_name}\s*=\s*(-?\d+(?:\.\d+)?)", latex_to_plain(question))
        if match:
            substitutions[symbol] = safe_parse(match.group(1))
    if substitutions:
        expression = expression.subs(substitutions)

    try:
        value = sp.simplify(expression)
    except Exception:
        return _check("表达式独立计算", "skip", "表达式化简失败", "weak")

    expected = NormalizedAnswer(
        str(value),
        "number" if value.is_number else "expression",
        value,
    )
    if answers_equivalent(expected, answer):
        return _check("表达式独立计算", "pass", f"独立计算得：{value}")
    return _check("表达式独立计算", "fail", f"独立计算得：{value}；模型答案：{describe_answer(answer)}")


def check_function(question: str, answer: NormalizedAnswer) -> dict | None:
    text = latex_to_plain(question)
    if not re.search(r"f\s*\(\s*x\s*\)", text):
        return None
    function = _extract_function(question)
    point = _extract_function_point(question)
    if function is None or point is None:
        return None
    try:
        value = sp.simplify(function.subs(X, point))
    except Exception:
        return _check("函数值独立计算", "skip", "函数代入失败", "weak")
    expected = NormalizedAnswer(str(value), "expression" if not value.is_number else "number", value)
    if answers_equivalent(expected, answer):
        return _check("函数值独立计算", "pass", f"f({point})={value}")
    return _check("函数值独立计算", "fail", f"独立计算 f({point})={value}；模型答案：{describe_answer(answer)}")


def check_derivative(question: str, answer: NormalizedAnswer) -> dict | None:
    text = latex_to_plain(question)
    if not re.search(r"求导|导数|f\s*'\s*\(\s*x\s*\)|f′|微分", text):
        return None
    function = _extract_function(question)
    if function is None:
        return None
    try:
        derivative = sp.simplify(sp.diff(function, X))
    except Exception:
        return _check("导数独立计算", "skip", "求导失败", "weak")
    point = _extract_function_point(question)
    if point is not None:
        try:
            derivative = sp.simplify(derivative.subs(X, point))
        except Exception:
            pass
    expected = NormalizedAnswer(str(derivative), "number" if derivative.is_number else "expression", derivative)
    if answers_equivalent(expected, answer):
        return _check("导数独立计算", "pass", f"f'(x)={derivative}")
    return _check("导数独立计算", "fail", f"独立求导得：{derivative}；模型答案：{describe_answer(answer)}")


def check_integral(question: str, answer: NormalizedAnswer) -> dict | None:
    text = latex_to_plain(question)
    if "∫" not in text and "积分" not in text:
        return None
    # Try a definite integral: ∫_(a)^(b) body dx
    match = re.search(
        r"∫\s*_?\(?([^\)^]+?)\)?\s*\^?\(?([^\)]+?)\)?\s*(.*?)\s*d\s*([xyz])",
        text,
    )
    if match:
        lower_text, upper_text, body_text, variable_name = match.groups()
        variable = {"x": X, "y": Y, "z": Z}[variable_name]
        try:
            lower = safe_parse(lower_text)
            upper = safe_parse(upper_text)
            body = safe_parse(body_text)
            value = sp.simplify(sp.integrate(body, (variable, lower, upper)))
        except Exception:
            return _check("定积分独立计算", "skip", "定积分解析失败", "weak")
        expected = NormalizedAnswer(str(value), "number" if value.is_number else "expression", value)
        if answers_equivalent(expected, answer):
            return _check("定积分独立计算", "pass", f"独立积分得：{value}")
        return _check("定积分独立计算", "fail", f"独立积分得：{value}；模型答案：{describe_answer(answer)}")

    # Indefinite integral: differentiate the candidate and compare with integrand.
    match = re.search(r"∫\s*(.*?)\s*d\s*([xyz])", text)
    if match:
        body_text, variable_name = match.groups()
        variable = {"x": X, "y": Y, "z": Z}[variable_name]
        try:
            body = safe_parse(body_text)
        except Exception:
            return _check("不定积分独立校验", "skip", "被积函数解析失败", "weak")
        if answer.kind not in ("expression", "number"):
            return _check("不定积分独立校验", "skip", "答案不是表达式", "weak")
        try:
            derivative = sp.simplify(sp.diff(answer.value, variable))
            equal = _expressions_equal(derivative, body)
        except Exception:
            equal = False
        if equal:
            return _check("不定积分独立校验", "pass", "答案求导后等于被积函数")
        return _check("不定积分独立校验", "fail", "答案求导后与被积函数不一致")
    return None


def _parse_options(question: str) -> dict[str, str]:
    text = latex_to_plain(question)
    options: dict[str, str] = {}
    pattern = re.compile(r"([A-D])\s*[.、:：]\s*(.*?)(?=(?:\s+[A-D]\s*[.、:：])|$)")
    for match in pattern.finditer(text):
        letter = match.group(1)
        value = match.group(2).strip(" ;；,，。")
        if value:
            options[letter] = value
    return options


def check_choice(question: str, answer: NormalizedAnswer) -> dict | None:
    options = _parse_options(question)
    if not options:
        return None
    if answer.kind == "choice":
        if str(answer.value) in options:
            return _check("选项存在性", "pass", f"选项 {answer.value} 存在", "weak")
        return _check("选项存在性", "fail", f"选项 {answer.value} 不存在", "weak")
    matches = []
    for letter, option_text in options.items():
        option_answer = normalize_answer(option_text)
        if answers_equivalent(option_answer, answer):
            matches.append(letter)
    if len(matches) == 1:
        return _check("选项数值匹配", "pass", f"答案与选项 {matches[0]} 一致")
    if len(matches) > 1:
        return _check("选项数值匹配", "skip", "答案与多个选项同时匹配", "weak")
    return _check("选项数值匹配", "fail", "答案未匹配任何选项")


def check_unit(question: str, answer: NormalizedAnswer) -> dict | None:
    if answer.kind not in ("number", "expression"):
        return None
    raw = answer.raw
    has_unit = bool(re.search(r"[a-zA-Zμ]+(?:\^?\d+)?|米|厘米|千米|克|千克|秒|分钟|小时|焦|瓦|伏|安|摩尔|升", raw))
    if has_unit:
        return _check("单位格式", "pass", "答案包含单位", "weak")
    return _check("单位格式", "skip", "答案未包含单位，需人工确认", "weak")


def verify_answer(question: str, raw_answer: str, answer_type: str | None = None, subject: str = "数学") -> dict:
    answer = normalize_answer(raw_answer, answer_type)
    checks: list[dict] = []

    if subject == "数学":
        for checker in (
            check_equation,
            check_expression,
            check_function,
            check_derivative,
            check_integral,
            check_choice,
        ):
            try:
                result = checker(question, answer)
            except Exception as exc:  # noqa: BLE001
                result = _check("校验器异常", "skip", str(exc), "weak")
            if result:
                checks.append(result)
    else:
        result = check_unit(question, answer)
        if result:
            checks.append(result)
        choice = check_choice(question, answer)
        if choice:
            checks.append(choice)

    strong = [check for check in checks if check["strength"] == "strong"]
    strong_pass = [check for check in strong if check["status"] == "pass"]
    strong_fail = [check for check in strong if check["status"] == "fail"]
    weak_fail = [check for check in checks if check["strength"] == "weak" and check["status"] == "fail"]

    if strong_fail or weak_fail:
        verdict = "fail"
    elif strong_pass:
        verdict = "pass"
    elif checks:
        verdict = "skip"
    else:
        verdict = "none"

    return {
        "answer": answer.public(),
        "checks": checks,
        "verdict": verdict,
        "independent_verified": bool(strong_pass),
        "contradicted": bool(strong_fail or weak_fail),
        "strong_check_count": len(strong),
        "checked_count": len([check for check in checks if check["status"] == "pass"]),
    }


def compare_answers(question: str, expected_raw: str, student_raw: str, expected_type: str | None = None, subject: str = "数学") -> dict:
    expected = normalize_answer(expected_raw, expected_type)
    student = normalize_answer(student_raw)

    # If one side is a choice letter, map it through the options before comparing.
    options = _parse_options(question)
    if expected.kind == "choice" and student.kind != "choice" and options.get(str(expected.value)):
        expected = normalize_answer(options[str(expected.value)])
    elif student.kind == "choice" and expected.kind != "choice" and options.get(str(student.value)):
        student = normalize_answer(options[str(student.value)])

    equivalent = answers_equivalent(expected, student)
    if equivalent:
        reason = "两个答案在数学上等价。"
    elif expected.error:
        reason = "标准答案无法被本地解析，已转为文本比较。"
    elif student.error:
        reason = "你的答案无法被本地解析，请检查格式。"
    elif expected.kind != student.kind:
        reason = f"答案类型不同：标准答案按 {expected.kind} 解析，你的答案按 {student.kind} 解析。"
    else:
        reason = "两个答案不等价，建议重新检查计算过程。"
    return {
        "equivalent": bool(equivalent),
        "expected": expected.public(),
        "student": student.public(),
        "reason": reason,
    }


def group_candidates(candidates: list[dict]) -> list[dict]:
    """Group {answer: str, answer_type: str} candidates by mathematical equivalence."""
    normalized = []
    effective_checks = []
    for item in candidates:
        primary = normalize_answer(item.get("check") or item.get("answer", ""), item.get("answer_type"))
        check_value = item.get("check") or item.get("answer", "")
        if primary.error:
            fallback = normalize_answer(item.get("answer", ""), item.get("answer_type"))
            if not fallback.error:
                primary = fallback
                check_value = item.get("answer", "")
        normalized.append(primary)
        effective_checks.append(check_value)

    groups: list[list[int]] = []
    for index, answer in enumerate(normalized):
        placed = False
        for group in groups:
            if answers_equivalent(normalized[group[0]], answer):
                group.append(index)
                placed = True
                break
        if not placed:
            groups.append([index])
    groups.sort(key=len, reverse=True)
    return [
        {
            "indices": group,
            "size": len(group),
            "answer": candidates[group[0]].get("answer", ""),
            "check": effective_checks[group[0]],
            "answer_type": candidates[group[0]].get("answer_type", "text"),
            "normalized": normalized[group[0]].public(),
        }
        for group in groups
    ]


if __name__ == "__main__":
    examples = [
        ("解方程 2x+5=13", "x=4", "equation"),
        ("解方程 x^2-5x+6=0", "x=2 或 x=3", "equation"),
        ("解不等式 3x-2<7", "x<3", "interval"),
        ("计算 (-3)^2-2×(-4)", "17", "number"),
        ("化简 (x+2)^2-x(x+4)", "4", "expression"),
        ("已知 f(x)=2x+1，求 f(3)", "7", "number"),
        ("求 f(x)=x^3-3x 的导数", "3x^2-3", "expression"),
        ("计算 ∫_0^1 x^2 dx", "1/3", "number"),
    ]
    for question, answer, kind in examples:
        result = verify_answer(question, answer, kind)
        print(question, "=>", result["verdict"], [c["status"] for c in result["checks"]], [c["detail"] for c in result["checks"] if c["status"] == "fail"])
