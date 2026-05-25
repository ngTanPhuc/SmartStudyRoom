from yolobit import *
from machine import Pin, SoftI2C
from aiot_dht20 import DHT20
from aiot_rgbled import RGBLed
import sys
import uselect
import time

aiot_dht20 = DHT20()
# LED RGB cắm tại chân P14 (4 bóng)
tiny_rgb = RGBLed(pin14.pin, 4)

# Cấu hình uselect để theo dõi sys.stdin (cổng USB)
spoll = uselect.poll()
spoll.register(sys.stdin, uselect.POLLIN)

# Biến quản lý thời gian gửi cảm biến
last_sensor_time = time.ticks_ms()

print("YoloBit Ready!")


def read_serial_input():
    # Kiểm tra trong 0ms xem có dữ liệu mới không
    if spoll.poll(0):
        return sys.stdin.readline().strip()
    return None


while True:
    line = read_serial_input()

    if line:
        if line.startswith("S"):
            try:
                percent = int(line.replace("S", ""))
                # Chuyển đổi 0-100% sang 0-1023
                speed_val = round(translate(percent, 0, 100, 0, 1023))
                # Quạt kết nối tại chân P0
                pin1.write_analog(speed_val)
                print("ACK:FAN:" + str(percent))
            except:
                pass

        # Xử lý lệnh LED (1: Bật đỏ, 0: Tắt)
        elif line == "1":
            for i in range(4):
                tiny_rgb.show(i, (255, 255, 255))
            print("ACK:LED:ON")

        elif line == "0":
            for i in range(4):
                tiny_rgb.show(i, (0, 0, 0))
            print("ACK:LED:OFF")

    curr_time = time.ticks_ms()
    if time.ticks_diff(curr_time, last_sensor_time) > 5000:
        try:
            aiot_dht20.read_dht20()
            temp = aiot_dht20.dht20_temperature()
            humi = aiot_dht20.dht20_humidity()
            raw_light = pin0.read_analog()
            light_val = round(translate(raw_light, 0, 4095, 0, 100))

            # Gửi lên Gateway (Máy tính sẽ đọc được qua Serial)
            print("T:" + str(temp))
            print("H:" + str(humi))
            print("L:" + str(light_val))

        except:
            # Nếu lỗi cảm biến, không làm treo chương trình
            pass

        last_sensor_time = curr_time

    time.sleep_ms(20)