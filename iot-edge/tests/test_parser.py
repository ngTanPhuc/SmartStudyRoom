import unittest

from app.parser import map_command, parse_sensor_line


class ParserTest(unittest.TestCase):
    def test_parse_sensor_line_maps_known_prefixes(self):
        self.assertEqual(parse_sensor_line("T:26.5"), {"sensorType": "TEMPERATURE", "value": 26.5})
        self.assertEqual(parse_sensor_line("H:60"), {"sensorType": "HUMIDITY", "value": 60.0})
        self.assertEqual(parse_sensor_line("L:400"), {"sensorType": "LIGHT", "value": 400.0})

    def test_parse_sensor_line_ignores_invalid_lines(self):
        self.assertIsNone(parse_sensor_line("READY"))
        self.assertIsNone(parse_sensor_line("T:not-a-number"))

    def test_map_command_filters_by_user_and_maps_devices(self):
        self.assertEqual(map_command({"userId": "u1", "deviceType": "FAN", "value": 66}, "u1"), "S66")
        self.assertEqual(map_command({"userId": "u1", "deviceType": "LIGHT", "value": 100}, "u1"), "1")
        self.assertEqual(map_command({"userId": "u1", "deviceType": "LIGHT", "value": 0}, "u1"), "0")
        self.assertIsNone(map_command({"userId": "other", "deviceType": "FAN", "value": 66}, "u1"))


if __name__ == "__main__":
    unittest.main()
