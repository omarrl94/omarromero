# Copia al proyecto los recursos del pack «Ninja Adventure» (Pixel-boy & AAA, CC0) que usa Bitlandia.
# Uso: python3 scripts/import-assets.py <carpeta del pack top-down-rpg> <carpeta de audio del pack>
import os, shutil, subprocess, sys
SRC, AUDIO = sys.argv[1], sys.argv[2]
DST = os.path.join(os.path.dirname(__file__), '..', 'public', 'game')
os.makedirs(DST, exist_ok=True)

def cp(src, dst):
    d = os.path.join(DST, dst)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copyfile(os.path.join(SRC, src), d)

MON = ['Slime3','Octopus2','GoldRacoon','Racoon','BambooYellow','DragonYellow','ButterflyBlue','BlueBat','Flam','Spirit2','Owl','Butterfly','Cyclope2','Eye','Cyclope','Eye2','Mole','Panda','KappaRed','RedOctopus',
       'Slime','Slime2','Mushroom','Mushroom2','Slime4','Larva','Skull','SkullBlue','Snake','Snake2','Snake3','Snake4','Larva2','Mollusc','Mollusc2','Fish','FishRed','HeartRed','HeartGreen',
       'Spirit','SpiderRed','SpiderYellow','Octopus','GreenOctopus','LanternRed','LanternGreen','Owl2','Beast','Beast2','Bear','TRex','Grey Trex',
       'Axolot','Flam2','Mouse','Lizard','Mole2','MouseBlack','Reptile','KappaGreen','Bamboo','Dragon','AxolotBlue']
for m in MON:
    d = f'Actor/Monster/{m}'
    sheet = [f for f in os.listdir(os.path.join(SRC, d)) if f.endswith('.png') and f != 'Faceset.png'][0]
    key = m.replace(' ', '')
    cp(f'{d}/{sheet}', f'mon/{key}.png')
    cp(f'{d}/Faceset.png', f'mon/{key}-face.png')
for b in ['GiantSlime','GiantRacoonGold','GiantBamboo2','TenguBlue','GiantFlam','TenguRed','DemonCyclop2','DemonCyclop','GiantRacoon','SquidRed','GiantSpirit']:
    cp(f'Actor/Boss/{b}/Idle.png', f'boss/{b}.png')
    cp(f'Actor/Boss/{b}/Faceset.png', f'boss/{b}-face.png')
CH = ['Boy','Hunter','Master','Monk','Woman','Princess','NinjaDark','Vampire','Cavegirl','FighterWhite','EggGirl','Shaman','Child','OldMan','Villager4','Villager3','OldWoman','Inspector','KnightGold','RobotGrey']
for c in CH:
    cp(f'Actor/Character/{c}/SpriteSheet.png', f'char/{c}.png')
    cp(f'Actor/Character/{c}/Faceset.png', f'char/{c}-face.png')
for t in ['TilesetFloor','TilesetNature','TilesetHouse','TilesetWater','TilesetDungeon','TilesetFloorDetail']:
    cp(f'Backgrounds/Tilesets/{t}.png', f'tiles/{t}.png')
for f in ['DialogueBoxSimple','DialogBox','FacesetBox','ChoiceBox']:
    cp(f'Ui/Dialog/{f}.png', f'ui/{f}.png')
for f in ['nine_path_panel','nine_path_panel_2','nine_path_bg','button_normal','button_hover','button_pressed']:
    cp(f'Ui/Theme/Theme Wood/{f}.png', f'ui/{f}.png')
cp('Ui/Emote/emote22.png', 'ui/emote-alert.png')
cp('FX/Slash/SpriteSheetSlash02.png', 'fx/slash.png')
cp('FX/Elemental/Explosion/SpriteSheet.png', 'fx/explosion.png')
cp('FX/Magic/Spark/SpriteSheet.png', 'fx/spark.png')
cp('FX/Smoke/Smoke/SpriteSheet.png', 'fx/smoke.png')
cp('LICENSE.txt', 'LICENSE-NinjaAdventure.txt')

def mp3(src, dst, br='96k'):
    d = os.path.join(DST, dst)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(AUDIO, src), '-b:a', br, d], check=True)
MUSIC = {'title': 'Musics/1 - Adventure Begin.ogg', 'town': 'Musics/33 - Calm Village.ogg', 'route': 'Musics/23 - Road.ogg', 'forest': 'Musics/37 - Dark Forest.ogg',
         'battle': 'Musics/17 - Fight.ogg', 'boss': 'Musics/24 - Final Area.ogg', 'cave': 'Musics/2 - The Cave.ogg', 'ending': 'Musics/8 - End Theme.ogg'}
for k, v in MUSIC.items(): mp3(v, f'music/{k}.mp3')
SFX = {'accept': 'Sounds/Menu/Accept.wav', 'move': 'Sounds/Menu/Move1.wav', 'cancel': 'Sounds/Menu/Cancel.wav', 'hit': 'Sounds/Hit & Impact/Hit2.wav',
       'impact': 'Sounds/Hit & Impact/Impact.wav', 'explosion': 'Sounds/Elemental/Explosion.wav', 'heal': 'Sounds/Magic & Skill/Heal.wav', 'magic': 'Sounds/Magic & Skill/Magic1.wav',
       'alert': 'Sounds/Alert/Alert.wav', 'coin': 'Sounds/Bonus/Coin.wav', 'powerup': 'Sounds/Bonus/PowerUp1.wav', 'levelup': 'Jingles/LevelUp1.wav',
       'success': 'Jingles/Success1.wav', 'gameover': 'Jingles/GameOver.wav', 'secret': 'Jingles/Secret1.wav', 'strange': 'Sounds/Magic & Skill/Strange.wav'}
for k, v in SFX.items(): mp3(v, f'sfx/{k}.mp3', '96k')
print('ok')
