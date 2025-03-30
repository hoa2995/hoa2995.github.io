import pymem, pymem.process, keyboard, time, os
from pynput.mouse import Controller, Button
from win32gui import GetWindowText, GetForegroundWindow
from win32api import GetSystemMetrics
from random import uniform
from offsets import *

mouse = Controller()
client = Client()

dwEntityList = client.offset('dwEntityList')
dwLocalPlayerPawn = client.offset('dwLocalPlayerPawn')
m_iTeamNum = client.get('C_BaseEntity', 'm_iTeamNum')
m_iHealth = client.get('C_BaseEntity', 'm_iHealth')
m_dwBoneMatrix = client.get('C_CSPlayerPawnBase', 'm_dwBoneMatrix')

triggerKey = "shift"
FOV = 50  # Phạm vi aim (pixels)
SMOOTHING = 5  # Độ mượt

# Lấy độ phân giải màn hình thực tế
def get_screen_resolution():
    return GetSystemMetrics(0), GetSystemMetrics(1)

# WorldToScreen cho 1440x1080 stretched
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

# Lấy vị trí đầu
def get_head_position(pm, entity):
    bone_matrix = pm.read_longlong(entity + m_dwBoneMatrix)
    if bone_matrix:
        head_x = pm.read_float(bone_matrix + 0x30 * 6 + 0x0C)
        head_y = pm.read_float(bone_matrix + 0x30 * 6 + 0x1C)
        head_z = pm.read_float(bone_matrix + 0x30 * 6 + 0x2C)
        return [head_x, head_y, head_z]
    return None

# Aim mượt
def smooth_aim(target_x, target_y):
    current_x, current_y = mouse.position()
    delta_x = (target_x - current_x) / SMOOTHING
    delta_y = (target_y - current_y) / SMOOTHING
    for _ in range(SMOOTHING):
        mouse.move(int(current_x + delta_x), int(current_y + delta_y))
        current_x += delta_x
        current_y += delta_y
        time.sleep(0.005)

def main():
    print(f"[-] TriggerBot + Aim for 1440x1080 stretched\n[-] Trigger key: {triggerKey.upper()}")
    pm = pymem.Pymem("cs2.exe")
    client_module = pymem.process.module_from_name(pm.process_handle, "client.dll").lpBaseOfDll

    while True:
        if not GetWindowText(GetForegroundWindow()) == "Counter-Strike 2":
            time.sleep(0.1)
            continue

        if keyboard.is_pressed(triggerKey):
            player = pm.read_longlong(client_module + dwLocalPlayerPawn)
            player_team = pm.read_int(player + m_iTeamNum)

            ent_list = pm.read_longlong(client_module + dwEntityList)
            closest_dist = FOV
            target_x, target_y = None, None

            for i in range(1, 64):
                ent_entry = pm.read_longlong(ent_list + 0x8 * (i >> 9) + 0x10)
                entity = pm.read_longlong(ent_entry + 120 * (i & 0x1FF))
                if not entity:
                    continue

                entity_team = pm.read_int(entity + m_iTeamNum)
                entity_hp = pm.read_int(entity + m_iHealth)
                if entity_team != player_team and entity_hp > 0:
                    head_pos = get_head_position(pm, entity)
                    if head_pos:
                        screen_x, screen_y = world_to_screen(pm, client_module, head_pos)
                        if screen_x and screen_y:
                            current_x, current_y = mouse.position()
                            dist = ((screen_x - current_x) ** 2 + (screen_y - current_y) ** 2) ** 0.5
                            if dist < closest_dist:
                                closest_dist = dist
                                target_x, target_y = screen_x, screen_y

            if target_x and target_y:
                smooth_aim(target_x, target_y)
                time.sleep(uniform(0.01, 0.03))
                mouse.press(Button.left)
                time.sleep(uniform(0.01, 0.05))
                mouse.release(Button.left)

            time.sleep(0.03)
        else:
            time.sleep(0.1)

if __name__ == '__main__':
    main()