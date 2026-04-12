import ast
import os
from collections import Counter
from math import sqrt
from typing import Dict


def _cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """
    Cosine similarity between two sparse vectors represented as dicts.
    Returns a value in [0, 1].
    """
    if not vec_a or not vec_b:
        return 0.0

    # Dot product
    dot = 0.0
    for k, va in vec_a.items():
        vb = vec_b.get(k)
        if vb is not None:
            dot += va * vb

    if dot == 0.0:
        return 0.0

    # Norms
    norm_a = sqrt(sum(v * v for v in vec_a.values()))
    norm_b = sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


def _python_signature(path: str) -> Dict[str, float]:
    """
    Build a simple structural signature for a Python file using its AST.
    Signature is a frequency map of selected node types.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            source = f.read()
        tree = ast.parse(source)
    except Exception:
        return {}

    counter: Counter[str] = Counter()

    for node in ast.walk(tree):
        name = type(node).__name__
        # Focus on higher-signal node types.
        if name in {
            "FunctionDef",
            "AsyncFunctionDef",
            "ClassDef",
            "For",
            "While",
            "If",
            "Try",
            "With",
            "Return",
            "Call",
            "Assign",
            "AugAssign",
            "ListComp",
            "DictComp",
            "SetComp",
        }:
            counter[name] += 1

    total = sum(counter.values())
    if total == 0:
        return {}

    # Normalize to relative frequencies so file length has less impact.
    return {k: v / total for k, v in counter.items()}


def _java_signature(path: str) -> Dict[str, float]:
    """
    Build a lightweight structural signature for a Java file.

    To avoid extra dependencies, this uses simple keyword counting instead of a full parser.
    It's not as precise as an AST-based approach but still captures high-level structure.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            source = f.read()
    except Exception:
        return {}

    # Very simple tokenization by splitting on whitespace and punctuation.
    # This is intentionally lightweight; we're only counting a small set of keywords.
    tokens = []
    current = []
    for ch in source:
        if ch.isalnum() or ch == "_":
            current.append(ch)
        else:
            if current:
                tokens.append("".join(current))
                current = []
    if current:
        tokens.append("".join(current))

    if not tokens:
        return {}

    keywords = {
        "class",
        "interface",
        "enum",
        "extends",
        "implements",
        "public",
        "private",
        "protected",
        "static",
        "final",
        "abstract",
        "synchronized",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "try",
        "catch",
        "finally",
        "throw",
        "throws",
        "return",
        "new",
    }

    counter: Counter[str] = Counter(t for t in tokens if t in keywords)
    total = sum(counter.values())
    if total == 0:
        return {}

    return {k: v / total for k, v in counter.items()}


def compute_signature(path: str, language: str) -> Dict[str, float]:
    """
    Compute a structural signature for the given file path and language.

    Returns a dict that can be compared with cosine similarity.
    """
    lang = (language or "").lower()
    # Only run structural similarity for real files.
    if not path or not os.path.isfile(path):
        return {}

    if lang == "python" or path.endswith(".py"):
        return _python_signature(path)
    if lang == "java" or path.endswith(".java"):
        return _java_signature(path)

    # Unsupported language for now.
    return {}


def structural_similarity(path_a: str, path_b: str, language: str) -> float:
    """
    Compute structural similarity between two files by building AST-based signatures
    and comparing them with cosine similarity.
    """
    sig_a = compute_signature(path_a, language)
    sig_b = compute_signature(path_b, language)
    return _cosine_similarity(sig_a, sig_b)

