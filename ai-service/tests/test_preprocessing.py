import unittest

from app.preprocessing import normalize_slang, normalize_text, remove_punctuation, tokenize_text


class PreprocessingTest(unittest.TestCase):
    def test_normalize_text_collapses_whitespace(self):
        self.assertEqual(normalize_text("  BẬT   ĐÈN  "), "bật đèn")

    def test_remove_punctuation_preserves_vietnamese(self):
        self.assertEqual(remove_punctuation("bật đèn, giúp!"), "bật đèn giúp")

    def test_normalize_slang_maps_common_words(self):
        self.assertEqual(normalize_slang("ko bật đèn giùm"), "không bật đèn giúp")

    def test_tokenize_text_falls_back_to_whitespace(self):
        self.assertGreaterEqual(len(tokenize_text("bật đèn")), 1)


if __name__ == "__main__":
    unittest.main()
