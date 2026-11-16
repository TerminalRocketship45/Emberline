import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
RAW = os.path.join(ROOT, "raw")
TEXT = os.path.join(RAW, "psi_pages")
PSI_BASE = "https://psi.nasa.gov/physci/repo/data/investigations/PSI-"
ATM_PSI = 14.696
BAR_PSI = 14.504
PAGE_IDS = [20, 25, 26, 39, 47, 68, 69, 98, 99, 100, 101, 102, 159]
ALL_IDS = [159, 10, 21, 22, 23, 106, 107, 117, 62, 60, 142, 115] + [20, 25, 26, 39, 47, 68, 69, 98, 99, 100, 101, 102]


def atm(x):
    return round(x * ATM_PSI, 1)


def bar(x):
    return round(x * BAR_PSI, 1)


def dump(name, obj):
    with open(os.path.join(DATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)
