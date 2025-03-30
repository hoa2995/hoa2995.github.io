import pymem, pymem.process, keyboard, time, os
from pynput.mouse import Controller, Button
from win32gui import GetWindowText, GetForegroundWindow
from win32api import GetSystemMetrics
from random import uniform, randint
from offsets import *  # File offsets.py của mày

mouse = Controller()
client = Client()

dwEntityList = client.offset('dwEntityList')
dwLocalPlayerPawn = client.offset('dwLocalPlayerPawn')
m_iTeamNum = client.get('C_BaseEntity', 'm_iTeamNum')
m_iHealth = client.get('C_BaseEntity', 'm_iHealth')
m_dwBoneMatrix = 0xA78  # Hardcode offset

triggerKey = "shift"
FOV = 30  # Giảm FOV để tránh snap aim toàn màn hình
SMOOTHING = 7  # Tăng smoothing để aim mượt hơn

def get_screen_resolution():
    return GetSystemMetrics(0), GetSystemMetrics(1)

def world_to_screen(pm, client_module, entity_pos):
    render_width, render_height = 1440, 1080
    screen_width, screen_height = get_screen_resolution()
    scale_x = screen_width / render_width
    scale_y = screen_height / render_height

    dwViewMatrix = client.offset('dwViewMatrix')
    view_matrix = [pm.read_float(client_module + dwViewMatrix + i * 4) for i in range(16)]

    x, y, z = entity_pos
    clip_x = x * view_matrix[0] + y * view_matrix[1] + z * view_matrix[2] + view_matrix[3]
    clip_y = x * view_matrix[4] + y * view_matrix[5] + z * view_matrix[6] + view_matrix[7]
    clip_w = x * view_matrix[12] + y * view_matrix[13] + z * view_matrix[14] + view_matrix[15]

    if clip_w < 0.1:
        return None, None

    ndc_x = clip_x / clip_w
    ndc_y = clip_y / clip_w
    screen_x = (render_width / 2) * ndc_x + (render_width / 2)
    screen_y = -(render_height / 2) * ndc_y + (render_height / 2)

    screen_x = screen_x * scale_x
    screen_y = screen_y * scale_y

    if screen_x < 0 or screen_x > screen_width or screen_y < 0 or screen_y > screen_height:
        return None, None
    return int(screen_x), int(screen_y)

def get_head_position(pm, entity):
    bone_matrix = pm.read_longlong(entity + m_dwBoneMatrix)
    if not bone_matrix:
        return None
    head_x = pm.read_float(bone_matrix + 0xCC)  # Bone 8 (head) X
    head_y = pm.read_float(bone_matrix + 0xDC)  # Bone 8 (head) Y
    head_z = pm.read_float(bone_matrix + 0xEC)  # Bone 8 (head) Z
    return [head_x, head_y, head_z]

def smooth_aim(target_x, target_y):
    current_x, current_y = mouse.position
    # Thêm nhiễu ngẫu nhiên để giống người thật
    noise_x = randint(-5, 5)
    noise_y = randint(-5, 5)
    target_x += noise_x
    target_y += noise_y

    delta_x = (target_x - current_x) / SMOOTHING
    delta_y = (target_y - current_y) / SMOOTHING
    for _ in range(SMOOTHING):
        current_x += delta_x
        current_y += delta_y
        mouse.move(int(delta_x), int(delta_y))
        time.sleep(uniform(0.005, 0.01))  # Random delay

def main():
    print(f"[-] TriggerBot + Aim for 1440x1080 stretched\n[-] Trigger key: {triggerKey.upper()}")
    try:
        pm = pymem.Pymem("cs2.exe")
        client_module = pymem.process.module_from_name(pm.process_handle, "client.dll").lpBaseOfDll
    except:
        print("CS2 not running!")
        return

    while True:
        if not GetWindowText(GetForegroundWindow()) == "Counter-Strike 2":
            time.sleep(0.5)  # Tăng delay khi không active
            continue

        if keyboard.is_pressed(triggerKey):
            try:
                player = pm.read_longlong(client_module + dwLocalPlayerPawn)
                player_team = pm.read_int(player + m_iTeamNum)
            except:
                time.sleep(0.1)
                continue

            ent_list = pm.read_longlong(client_module + dwEntityList)
            closest_dist = FOV
            target_x, target_y = None, None

            for i in range(1, 64):
                try:
                    ent_entry = pm.read_longlong(ent_list + 0x8 * (i >> 9) + 0x10)
                    entity = pm.read_longlong(ent_entry + 120 * (i & 0x1FF))
                    if not entity:
                        continue

                    entity_team = pm.read_int(entity + m_iTeamNum)
                    entity_hp = pm.read_int(entity + m_iHealth)
                    if entity_team != player_team and entity_hp > 0:
                        pos = get_head_position(pm, entity)
                        if pos:
                            screen_x, screen_y = world_to_screen(pm, client_module, pos)
                            if screen_x and screen_y:
                                current_x, current_y = mouse.position
                                dist = ((screen_x - current_x) ** 2 + (screen_y - current_y) ** 2) ** 0.5
                                if dist < closest_dist:
                                    closest_dist = dist
                                    target_x, target_y = screen_x, screen_y
                except:
                    continue

            if target_x and target_y:
                smooth_aim(target_x, target_y)
                time.sleep(uniform(0.02, 0.05))  # Random delay trước bắn
                mouse.press(Button.left)
                time.sleep(uniform(0.02, 0.06))  # Random delay khi bắn
                mouse.release(Button.left)

            time.sleep(uniform(0.05, 0.15))  # Delay lớn hơn giữa các lần aim
        else:
            time.sleep(0.2)  # Delay khi không nhấn trigger

if __name__ == '__main__':
    main()
