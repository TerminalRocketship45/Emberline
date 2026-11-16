import os
import pandas as pd
from common import dump, RAW, bar

HABITATS = [
    {"id": "iss", "name": "International Space Station cabin", "shortName": "ISS", "o2Pct": 21, "pressurePsia": 14.7, "gravityG": 0,
     "note": "Nominal ISS and Shuttle cabin air is 21 percent O2 (plus or minus 2) at 14.7 psia; materials were tested up to 24.1 percent O2. Microgravity.",
     "sourceIds": ["olson-2008-tm", "harper-2016-moc"]},
    {"id": "lunar-base", "name": "Lunar base (challenge definition)", "shortName": "Lunar base", "o2Pct": 30, "pressurePsia": 10.2, "gravityG": 0.16,
     "note": "The challenge statement describes a lunar base atmosphere of at least 30 percent O2 at no more than 10.2 psia. Lunar gravity is about 0.16 g.",
     "sourceIds": ["challenge-2026"]},
    {"id": "exploration", "name": "Exploration atmosphere (HLS, lunar habitat, pressurized rover)", "shortName": "Exploration 8.2 psia", "o2Pct": 34, "pressurePsia": 8.2, "gravityG": 0.16,
     "note": "Nominal 8.2 psia and 34 percent O2, physiologically equivalent to 10.2 psia and 26.5 percent O2. Control bands run up to 37 percent O2. Lunar gravity is about 0.16 g.",
     "sourceIds": ["ferkul-2026-lpsc", "norcross-2015-hypoxia"]},
    {"id": "spacesuit", "name": "Spacesuit", "shortName": "Spacesuit", "o2Pct": 100, "pressurePsia": 4.3, "gravityG": 0,
     "note": "Pure oxygen at 4.3 psia, per the challenge statement. Gravity depends on the mission phase.",
     "sourceIds": ["challenge-2026"]},
    {"id": "earth", "name": "Earth sea level", "shortName": "Earth", "o2Pct": 20.9, "pressurePsia": 14.7, "gravityG": 1,
     "note": "Reference atmosphere: 20.9 percent O2 at 14.7 psia, 1 g. This is the basis of the 1 g NASA-STD-6001 Test 1 screening method.",
     "sourceIds": ["olson-2008-tm"]},
]


def cfig_frame():
    d = pd.read_csv(os.path.join(RAW, "psi159_cfig_inverse_flames.csv"))
    return d.dropna(subset=["XO2", "approx p (bar)"]).copy()


def tests():
    d = cfig_frame()
    out = []
    for _, r in d.iterrows():
        hot = str(r["Hot ignition"]).strip().lower()
        ignited = True if hot in ("yes", "flash") else (False if hot == "no" else None)
        code = str(r["Self -ext or flow term"]).strip()
        parts = []
        if code == "SE":
            parts.append("Self-extinguished")
        elif code == "FT":
            parts.append("Flow terminated")
        if hot == "flash":
            parts.append("Flash ignition")
        if isinstance(r["Comments"], str) and r["Comments"].strip():
            parts.append(r["Comments"].strip())
        out.append({
            "investigationId": "PSI-159",
            "testId": str(r["Test"]).strip(),
            "fuel": str(r["Fuel"]).strip(),
            "o2Pct": round(float(r["XO2"]) * 100, 1),
            "pressurePsia": bar(float(r["approx p (bar)"])),
            "ignited": ignited,
            "outcome": "; ".join(parts) if parts else None,
            "flameType": str(r["Flame Type"]).strip().lower(),
        })
    return out


def cfig_ranges():
    d = cfig_frame()
    o2 = [round(d["XO2"].min() * 100, 1), round(d["XO2"].max() * 100, 1)]
    p = [bar(d["approx p (bar)"].min()), bar(d["approx p (bar)"].max())]
    fuels = sorted(d["Fuel"].str.strip().unique())
    return o2, p, len(d), fuels


def f(id, text, value, sources, verified):
    return {"id": id, "text": text, "value": value, "sourceIds": sources, "verified": verified}


def findings():
    o2, p, n, _ = cfig_ranges()
    return [
        f("f-saffire-spread", "In the large Saffire fabric burns in microgravity, concurrent-flow flame spread over the SIBAL fabric (40.6 by 94 cm, in air at about 21.5 percent O2 and 1 atm) reached a steady rate of 1.8 mm/s in Saffire-I (20 cm/s duct flow) and 2.3 mm/s in Saffire-III (25 cm/s). In 1 g the same sample burns completely and the fire accelerates.", "1.8 mm/s (Saffire-I); 2.3 mm/s (Saffire-III)", ["urban-2017-asgsr", "ferkul-2017-saffire", "psi-98", "psi-100"], True),
        f("f-saffire-opposed", "Opposed-flow (upwind) spread in microgravity was sustained at 1.3 mm/s in Saffire-I and 0.98 mm/s in Saffire-III, whereas the 1 g downward-burn analogue did not propagate.", "1.3 mm/s and 0.98 mm/s", ["urban-2017-asgsr", "ferkul-2017-saffire"], True),
        f("f-saffire-flame-length", "Saffire flames reached a steady flame length: about 40 mm for concurrent spread and about 24 mm for opposed spread, rather than growing without limit as the 1 g fire does.", "about 40 mm concurrent; about 24 mm opposed", ["ferkul-2017-saffire", "urban-2017-asgsr"], True),
        f("f-saffire-2", "Saffire-II used small 5 by 29 cm samples at about 22.1 percent O2 with mixed results: silicone did not ignite in microgravity although it burned completely in 1 g, cotton-fiberglass burned completely, and Nomex burned about 5 cm in microgravity (about 0 in 1 g).", "SIBAL 2.1 mm/s at 20 cm/s; 2.6 mm/s at 25 cm/s", ["urban-2017-asgsr", "psi-99"], True),
        f("f-confinement", "Spread depends on duct confinement: smaller microgravity tunnels gave faster spread than Saffire because hot gas accelerates in the confined duct. A fire behind a panel may therefore be more hazardous than one in open cabin volume.", None, ["ferkul-2017-saffire", "urban-2019-cf"], True),
        f("f-test1-not-conservative", "The 1 g NASA-STD-6001 Test 1 limits are not conservative: materials burn in microgravity at lower O2, by up to 4 percent O2 mole fraction. Mylar G has a 1 g upper limiting oxygen index of 20.8 percent against 17 percent in 0 g at 10.2 psia.", "up to 4 percent O2 lower in 0 g", ["olson-2008-tm"], True),
        f("f-test1-materials", "Ultem 1000 limits are 26.5 percent O2 in 1 g and 24 percent in 0 g; Nomex HT90-40 is 25.4 percent in 1 g and 23 percent in 0 g (14.7 psia). The Ultem 0 g mean limit of 22.5 percent lies inside the ISS and Shuttle 21 plus or minus 2 percent band.", "Ultem 26.5 to 24; Nomex 25.4 to 23 percent O2", ["olson-2008-tm"], True),
        f("f-bass2-pmma", "BASS-II reports that PMMA rods sustain spread at 17 percent O2 in microgravity against 18 percent in 1 g, and that microgravity spread was faster at all comparable O2 levels and diameters. The test matrix spans 0.4 to 8 cm/s and 15 to 21 percent O2 in opposed flow.", "17 percent (0 g) vs 18 percent (1 g) O2", ["bass2-sci-rep-2018", "ferkul-2016-ices", "olson-2019-bass2", "psi-25"], False),
        f("f-u-shaped", "The flammability boundary is U-shaped in O2 against flow speed. The low-flow branch is quenching by radiative loss, observed near about 1 cm/s for thin fuels, and is unreachable in 1 g where buoyant flow is at least about 20 cm/s.", "quench near 1 cm/s", ["ferkul-2026-lpsc", "olson-2008-tm"], False),
        f("f-flex-loi", "FLEX measured the limiting oxygen index (LOI) of droplets: methanol burns down to about 12 to 13 percent O2 in O2 and inert-gas mixtures (0.7 and 1 atm, 12 to 30 percent O2, CO2 or He 0 to 70 percent).", "methanol LOI about 12-13 percent O2", ["nayagam-2013-loi", "psi-69"], True),
        f("f-flex-co2-he", "Reported FLEX LOIs (O2 mole fraction): O2/N2 about 0.12 for methanol and 0.15 for heptane; with CO2 about 0.14 and 0.17; with He at 1 atm about 0.14 and 0.15. CO2 raises the heptane LOI by about 2 points, whereas He barely changes it.", "CO2 +2 points; He about 0", ["nayagam-2013-loi", "dietrich-2014-flex"], False),
        f("f-cool-flames", "FLEX discovered cool flames: after a large heptane droplet's visible flame dies by radiative extinction, the droplet keeps vaporizing, sustained by soot-free low-temperature chemistry. A visibly dead fire can still be releasing fuel vapour.", None, ["nayagam-2012-cool", "dietrich-2015-tp"], False),
        f("f-cfi-scope", "CFI studies cool-flame burning of n-dodecane, n-dodecane/iso-dodecane mixtures and farnesane droplets at pressures from 0.25 to 5 atm, including the effect of helium dilution on cool-flame behaviour and soot formation during cool-flame combustion.", "0.25-5 atm; He dilution", ["psi-39"], True),
        f("f-cfig-cool-conditions", "In CFI-G, spherical gas-fueled cool diffusion flames were obtained only for normal n-butane flames at 2 bar and an ambient O2 mole fraction of 0.39; they were not readily produced elsewhere in the matrix. Burner temperature was found to matter.", "n-butane, 2 bar, XO2 0.39", ["kim-2023-cfig", "psi-159"], False),
        f("f-cfig-matrix", "The CFI-G experimental table in PSI holds %d tests with usable O2 and pressure, spanning %.0f to %.0f percent O2 and %.1f to %.1f psia, for ethane, propane and butane inverse flames." % (n, o2[0], o2[1], p[0], p[1]), "%d tests; %.0f-%.0f percent O2; %.1f-%.1f psia" % (n, o2[0], o2[1], p[0], p[1]), ["psi-159"], True),
        f("f-same-sizes", "Smoke from overheated spacecraft materials in low gravity is sub-micron: a substantial fraction of particles is below 500 nm in SAME, and most average sizes are 200 to 400 nm in SAME-2, with larger particles in some quiescent cases. Smoke transport is dominated by mixing, so detection lags are longer than in 1 g.", "below 500 nm (SAME); 200-400 nm (SAME-2)", ["urban-2009-same", "same2-ntrs", "psi-102", "psi-101"], False),
        f("f-same-r", "SAME-R flight tests ran from July 16 to September 9, 2010, completing 66 test points, with Pyrell intumescent foam replacing the DBP samples and new no-flow heating conditions.", "66 test points", ["psi-101"], True),
        f("f-bre-self-extinguish", "BRE microgravity flames emulating condensed fuels burned quasi-steadily in elevated-oxygen atmospheres without any airflow, whereas such flames in a normal 21 percent O2 atmosphere self-extinguished in a short time. The atmospheres planned for the flights were 14.7 psia and 21 percent, 10.2 psia and 26.5 percent, and 8.2 psia and 34 percent O2.", "21 percent self-extinguishes", ["psi-20"], True),
        f("f-bre-numbers", "In BRE, flames self-extinguished within 40 s at 21 percent O2 but burned steadily at 26.5, 34 and 40 percent O2 (ethylene/N2 burner of 25 and 50 mm, 0.57 to 1 bar). 34 percent is the 8.2 psia exploration atmosphere.", "steady at 26.5, 34, 40 percent", ["dehghani-diss-umd", "dehghani-2021-umd"], False),
        f("f-o2-fraction", "Fire responds to O2 fraction (mole fraction), not O2 partial pressure. Humans respond to constant O2 partial pressure even at reduced total pressure, so raising O2 to hold the breathing partial pressure at lower total pressure makes the cabin more flammable.", "mole fraction, not partial pressure", ["harper-2016-moc", "ferkul-2026-lpsc", "olson-2008-tm"], True),
        f("f-pressure-independent", "Upward Test 1 limits are nearly pressure-independent (1 g limiting-oxygen lines are almost vertical on an O2 against pressure plot, except halogenated materials). The opposed-flow spread correlation scales as X_O2^0.9 times P^0.05 (P in atm).", "X_O2^0.9 * P^0.05", ["olson-2008-tm", "harper-2016-moc"], True),
        f("f-low-pressure", "In 99.8 percent O2, the non-metallic materials tested became flammable between 0.4 and 0.9 psia, so low pressure alone does not make a material safe.", "0.4-0.9 psia", ["hirsch-2010"], True),
        f("f-30pct-not-worst", "Some materials with a maximum oxygen concentration of 30 percent at 10.2 psia fail at 25.9 percent at 14.7 psia, so the assumption that 30 percent and 10.2 psia is always the worst case is false for some materials.", "25.9 percent at 14.7 psia", ["harper-2016-moc", "olson-2008-tm"], True),
        f("f-exploration-atmosphere", "The current HLS, lunar habitat and pressurized rover atmosphere is nominally 8.2 psia and 34 percent O2 (O2 partial pressure about 2.79 psia, physiologically equivalent to 10.2 psia and 26.5 percent), with control bands up to 37 percent O2. No PSI solid-material (fabric or plastic) test has been run at this atmosphere; the only PSI flight tests at it are BRE's gas burner that emulates condensed fuels.", "8.2 psia; 34 percent (up to 37)", ["ferkul-2026-lpsc", "norcross-2015-hypoxia"], True),
        f("f-lunar-spread", "Downward flame spread over SIBAL fabric in air at lunar gravity is 0.11 cm/s in a centrifuge drop test and 0.086 cm/s in parabolic aircraft flight, and was steady for the whole 20 s test. In 1 g, downward spread over the same fabric cannot be achieved.", "0.11 cm/s; 0.086 cm/s", ["ferkul-2026-lpsc"], True),
        f("f-lunar-most-flammable", "Models show the O2 needed for flammability reaches a minimum near lunar gravity, and downward spread rate peaks in partial gravity, so lunar gravity may be close to the most flammable condition.", None, ["ferkul-2026-lpsc"], True),
        f("f-fm2", "A planned lunar-surface flame-spread test (FM2) will burn four fabric samples upward at 8.2 psia, starting at 37, 33, 29 and 25 percent O2; the test material has an expected lunar limiting oxygen concentration of 24 to 26 percent.", "8.2 psia; 37-25 percent O2", ["ferkul-2026-lpsc"], True),
        f("f-spread-multiplier", "Estimate (model, not a measurement): scaling the opposed-flow correlation from ISS air, flames spread about 1.5 times faster at 34 percent O2 and 8.2 psia (about 1.8 times for n = 1.25), about 1.4 times at 30 percent and 10.2 psia, and about 1.6 to 2.0 times at 37 percent and 8.2 psia. Valid for thin fabrics, 21 to 40 percent O2, 0.5 to 1 atm.", "1.51x (n=0.9) to 1.78x (n=1.25) at 34 percent, 8.2 psia", ["olson-2008-tm", "urban-2017-asgsr"], False),
        f("f-spice-length", "SPICE: the smoke-point flame length in microgravity increases with coflow velocity and decreases with burner diameter, correlating as d^-0.77 times u^0.48 (burner diameter d, coflow velocity u) in one analysis and d^-0.67 times u^0.27 in another.", "d^-0.77 u^0.48", ["dotson-spice", "debold-spice"], False),
        f("f-spice-soot-ranking", "SPICE sooting propensity ranking in the thesis analysis: methane is lowest, then ethane, ethylene, propane and propylene highest.", "methane < ethane < ethylene < propane < propylene", ["debold-spice"], False),
    ]


def main():
    dump("habitats.json", HABITATS)
    t = tests()
    dump("tests.json", t)
    fs = findings()
    dump("findings.json", fs)
    print("habitats", len(HABITATS), "tests", len(t), "findings", len(fs))


if __name__ == "__main__":
    main()
