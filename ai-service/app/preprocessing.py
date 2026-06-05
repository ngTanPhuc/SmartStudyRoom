import re


SLANG_DICTIONARY = {
    "ko": "không",
    "k": "không",
    "hok": "không",
    "vl": "rất",
    "giùm": "giúp",
    "dum": "giúp",
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_punctuation(text: str) -> str:
    return re.sub(r"[^\w\sà-ỹÀ-Ỹ]", "", text)


def normalize_slang(text: str) -> str:
    words = text.split()
    normalized_words = [SLANG_DICTIONARY.get(word, word) for word in words]
    return " ".join(normalized_words)


def tokenize_text(text: str) -> list[str]:
    try:
        from underthesea import word_tokenize

        tokens = word_tokenize(text)
        if isinstance(tokens, str):
            return tokens.split()
        return list(tokens)
    except Exception:
        return text.split()


def preprocess_text(text: str) -> str:
    text = normalize_text(text)
    text = remove_punctuation(text)
    text = normalize_slang(text)
    tokens = tokenize_text(text)
    return " ".join(tokens)
