from common import dump, load, atm, PSI_BASE
from build_data import cfig_ranges

FIND_MAP = {
    "PSI-98": ["f-saffire-spread", "f-saffire-opposed", "f-saffire-flame-length", "f-confinement"],
    "PSI-99": ["f-saffire-2"],
    "PSI-100": ["f-saffire-spread", "f-saffire-opposed", "f-saffire-flame-length"],
    "PSI-25": ["f-bass2-pmma", "f-u-shaped"],
    "PSI-26": ["f-test1-not-conservative", "f-confinement"],
    "PSI-69": ["f-flex-loi", "f-flex-co2-he", "f-cool-flames"],
    "PSI-68": [],
    "PSI-39": ["f-cfi-scope", "f-cool-flames"],
    "PSI-159": ["f-cfig-matrix", "f-cfig-cool-conditions"],
    "PSI-20": ["f-bre-self-extinguish", "f-bre-numbers"],
    "PSI-101": ["f-same-r", "f-same-sizes"],
    "PSI-102": ["f-same-sizes"],
    "PSI-107": ["f-spice-length", "f-spice-soot-ranking"],
    "PSI-117": ["f-cool-flames"],
    "PSI-142": ["f-cool-flames"],
    "PSI-115": ["f-same-sizes"],
    "PSI-62": ["f-u-shaped"],
}


def cond(o2, p, flow, diluents, gravity, sources):
    return {"o2Pct": o2, "pressurePsia": p, "flowCmS": flow, "diluents": diluents, "gravity": gravity, "sourceIds": sources}


def inv(n, short, name, kind, platform, hardware, years, fuelType, fuels, sample, objective, approach, conditions, varied, fixed, measurements, pillars, relevance, related, reuses, sources, testCount, confidence):
    return {
        "id": "PSI-%d" % n, "short": short, "name": name, "kind": kind,
        "psiDoi": DOIS.get(n), "psiUrl": PSI_BASE + str(n), "platform": platform, "hardware": hardware,
        "years": years, "fuelType": fuelType, "fuels": fuels, "sample": sample, "objective": objective,
        "approach": approach, "conditions": conditions, "varied": varied, "fixed": fixed,
        "measurements": measurements, "findings": [], "pillars": pillars, "habitatRelevance": relevance,
        "relatedIds": ["PSI-%d" % r if isinstance(r, int) else r for r in related], "reusesDataFrom": reuses, "sourceIds": sources, "testCount": testCount,
        "confidence": confidence,
    }


DOIS = {20: "10.60555/vb93-3y72", 25: "10.60555/4qc4-de67", 26: "10.60555/58h4-dy80", 39: "10.60555/m6pj-a914",
        47: "10.60555/ztgj-d202", 68: "10.60555/byp8-h018", 69: "10.60555/mbq8-0451", 98: "10.60555/0t15-1z43",
        99: "10.60555/2chp-m469", 100: "10.60555/040q-4h36", 101: "10.60555/2np7-jv14", 102: "10.60555/gd4k-8h62",
        159: "10.60555/cyt1-kh64"}

MG = "microgravity"


def build():
    o2c, pc, nc, fuelsc = cfig_ranges()
    L = []
    L.append(inv(159, "CFI-G", "Advanced Combustion via Microgravity Experiments / Cool Flames Investigation with Gases (ACME CFI-G)", "flight",
        "ISS Combustion Integrated Rack (CIR)", "ACME spherical porous burner modules with cameras, radiometers, photomultiplier tubes and thermocouples", None,
        "gas", ["ethane", "propane", "n-butane"], "Spherical porous burner, inverse and normal diffusion flames",
        "Determine the conditions in which cool diffusion flames occur for propane, n-butane and n-pentane, in normal and inverse flames, over a broad range of stoichiometric mixture fraction, adiabatic flame temperature and fluent flow rate, supported by CFD and kinetics.",
        "Spherical diffusion flame tests aboard the ISS with multiple fuels, reactant dilutions, flow rates and pressures for normal and inverse convection directions.",
        cond(o2c, pc, None, ["N2 (balance)"], MG, ["psi-159"]),
        "fuel, O2 mole fraction, pressure, fluent flow rate, flame direction (normal or inverse)", None,
        ["flame images", "thermal radiation", "burner temperature", "self-extinction or flow-termination outcome"], ["detection", "prevention"],
        "Foundational: cool flames emit little heat and light and may escape optical detection; the PSI table covers up to 85 percent O2 but not the 34 percent, 8.2 psia exploration atmosphere as a labelled point.",
        [], [], ["psi-159", "kim-2023-cfig", "nasa-acme-article"], nc, "high"))
    L.append(inv(10, "Flame Design", "ACME Flame Design", "flight", "ISS Combustion Integrated Rack (CIR), ACME", "ACME spherical burner", None,
        "gas", ["ethylene"], "Spherical diffusion flames",
        "Study the production and control of soot to optimise oxygen-enriched combustion and design robust soot-free flames.", None,
        cond(None, None, None, [], MG, ["nasa-flame-design"]), None, None, ["flame images", "soot"], ["prevention"],
        "Oxygen-enriched flames and radiative extinction behaviour are relevant to elevated-O2 habitats.", [], [], ["nasa-flame-design", "nasa-acme-article", "psi-10"], None, "medium"))
    L.append(inv(21, "CLD Flame", "ACME Coflow Laminar Diffusion Flame", "flight", "ISS Combustion Integrated Rack (CIR), ACME", "ACME coflow burner", None,
        "gas", ["methane", "ethylene"], "Coflow laminar diffusion flames, fuel diluted with N2",
        "Extend the range of flame conditions accurately predicted by validating kinetic and soot sub-models at extremes of fuel dilution, from sooty pure fuel to near-extinction dilute flames.", None,
        cond(None, None, None, ["N2 (in fuel)"], MG, ["nasa-cld-flame"]), "fuel dilution", None, ["flame structure", "soot"], ["prevention"],
        "Benchmark data for combustion models; no habitat-atmosphere conditions reported.", [], [], ["nasa-cld-flame", "nasa-acme-article", "psi-21"], None, "medium"))
    L.append(inv(22, "E-FIELD Flames", "ACME Electric-Field Effects on Laminar Diffusion Flames", "flight", "ISS Combustion Integrated Rack (CIR), ACME", "Burner with mesh electrode, up to 10 kV", None,
        "gas", ["methane", "ethylene"], "Coflow laminar diffusion flames in electric fields",
        "Understand flame ion production and how electric fields control non-premixed flames, including stability, soot and emissions.", None,
        cond(None, None, None, [], MG, ["nasa-e-field"]), "applied electric field, with and without air coflow", None, ["flame stability", "soot", "emissions"], ["prevention"],
        "Ion wind acts as a controllable weak flow on a buoyancy-free flame; no habitat-atmosphere conditions reported.", [], [], ["nasa-e-field", "psi-22"], None, "medium"))
    L.append(inv(23, "s-Flame", "ACME Structure and Response of Spherical Flames", "flight", "ISS Combustion Integrated Rack (CIR), ACME", "ACME spherical burner", None,
        "gas", ["hydrogen/methane mixtures", "ethylene"], "Spherical diffusion flames, soot-free and sooty",
        "Predict the structure and dynamics, including extinction and pulsating instabilities, of soot-free and sooty spherical diffusion flames.", None,
        cond(None, None, None, ["various inert diluents"], MG, ["nasa-s-flame"]), "fuel, diluent", None, ["flame growth", "extinction"], ["prevention"],
        "Radiative versus convective extinction limits inform model validation; no habitat conditions reported.", [], [], ["nasa-s-flame", "nasa-acme-article", "psi-23"], None, "medium"))
    L.append(inv(106, "SLICE", "Structure and Liftoff in Combustion Experiment", "flight", "ISS Microgravity Science Glovebox (MSG)", "Coflow burner in the glovebox", "2012",
        "gas", ["methane"], "Coflow diffusion flames",
        "Obtain coflow diffusion flame data from near-extinction to heavily sooting conditions to study gravity effects on flame liftoff, blowout and soot formation.", None,
        cond(None, None, None, [], MG, ["ma-2014-slice"]), "fuel flow, dilution, gravity", None, ["flame structure", "soot"], ["prevention"],
        "Soot and blowout behaviour in microgravity; no habitat conditions reported.", [], [], ["ma-2014-slice", "psi-106"], None, "medium"))
    L.append(inv(107, "SPICE", "Smoke Point In Coflow Experiment", "flight", "ISS Microgravity Science Glovebox (MSG)", "Coflow burner", None,
        "gas", ["ethylene", "propane", "propylene"], "Coflow laminar diffusion flames at the smoke point",
        "Measure laminar smoke points of coflow diffusion flames in microgravity against normal gravity.", None,
        cond(None, None, None, [], MG, ["dotson-spice"]), "fuel, burner diameter, coflow velocity", None, ["smoke-point flame length"], ["detection", "prevention"],
        "Sooting propensity data relevant to smoke production; no habitat conditions reported.", [], [], ["dotson-spice", "debold-spice", "psi-107"], None, "medium"))
    L.append(inv(117, "FLEX CFD", "OpenFOAM cool flame CFD using FLEX data", "ground", "Computational (OpenFOAM)", "CFD model", None,
        "liquid", ["n-alkane droplets"], "Droplet cool flames", "CFD of cool flames validated against ISS FLEX droplet data (title as given in the PSI listing; page not available).", None,
        cond(None, None, None, [], MG, ["psi-117"]), None, None, [], ["prevention"], None, ["PSI-69"], ["PSI-69"], ["psi-117", "scinapse-flex-cfd"], None, "low"))
    L.append(inv(62, "FGM vs BASS", "Flamelet-generated-manifold concurrent flame spread compared with BASS", "ground", "Computational", "FGM CFD model", None,
        "solid", ["fabric and solid fuels"], None, "Flamelet-generated-manifold modelling of solid-fuel flame spread compared with BASS data (title as given in the PSI listing; page not available).", None,
        cond(None, None, None, [], MG, ["psi-62"]), None, None, [], ["prevention"], None, ["PSI-26", "PSI-25"], ["PSI-26", "PSI-25"], ["psi-62", "buffalo-fgm"], None, "low"))
    L.append(inv(60, "SPICE soot", "SPICE soot analysis", "ground", "Analysis of SPICE data", "Soot analysis", None,
        "gas", ["ethylene", "propane"], None, "Soot analysis reusing SPICE data (title as given in the PSI listing; page not available).", None,
        cond(None, None, None, [], MG, ["psi-60"]), None, None, [], ["prevention"], None, ["PSI-107"], ["PSI-107"], ["psi-60"], None, "low"))
    L.append(inv(142, "FLEX cool flame", "Cool flame counterflow extinction using FLEX", "ground", "Computational and analysis", "Counterflow model", None,
        "liquid", ["n-alkanes"], None, "Counterflow cool-flame extinction compared with FLEX data (title as given in the PSI listing; page not available).", None,
        cond(None, None, None, [], MG, ["psi-142"]), None, None, [], ["prevention"], None, ["PSI-69"], ["PSI-69"], ["psi-142", "princeton-cool-counterflow"], None, "low"))
    L.append(inv(115, "SAME sim", "SAME smoke simulation", "ground", "Computational", "Smoke transport model", None,
        "solid", ["heated spacecraft materials"], None, "Smoke transport simulation using Smoke Aerosol Measurement Experiment data (title as given in the PSI listing; page not available).", None,
        cond(None, None, None, [], MG, ["psi-115"]), None, None, [], ["detection"], None, ["PSI-102"], ["PSI-102"], ["psi-115", "ntrs-20080012612"], None, "low"))

    L.append(inv(20, "BRE", "Advanced Combustion via Microgravity Experiments - Burning Rate Emulator (ACME BRE)", "flight",
        "ISS Combustion Integrated Rack (CIR), ACME", "Porous circular gas burners, 25 and 50 mm", "2010-2025 (PSI record)",
        "gas", ["methane/N2", "ethylene/N2"], "Gas burner emulating condensed-fuel burning",
        "Establish burning conditions in a quiescent microgravity ambient in terms of material properties, using CH4/N2 and C2H4/N2 on 25 and 50 mm porous burners in O2/N2 ambients at the planned atmospheres of 14.7 psia and 21 percent, 10.2 psia and 26.5 percent, and 8.2 psia and 34 percent O2, plus O2/CO2 and extinction limits.",
        "Establish chamber diluent, O2 and pressure, start fuel flow and ignite, then observe quasi-steady burning until extinction, burner temperature equilibrium or heat-flux sensor limit; later reduce fuel flow stepwise to find the extinction limit.",
        cond([21, 40], [8.2, 14.7], [0, 0], ["N2", "CO2 (desired)"], MG, ["psi-20", "dehghani-diss-umd"]),
        "ambient O2, pressure, burner size, fuel flow", "quiescent ambient",
        ["burner surface temperature", "heat flux", "flame extinction"], ["prevention"],
        "Planned flights include the 8.2 psia, 34 percent O2 atmosphere; flames self-extinguished at 21 percent but burned steadily in elevated-O2 atmospheres.",
        [], [], ["psi-20", "dehghani-diss-umd", "dehghani-2021-umd"], 19, "high"))
    L.append(inv(25, "BASS-II", "Burning and Suppression of Solids - II (BASS-II)", "flight", "ISS Microgravity Science Glovebox (MSG)",
        "Small wind tunnel in the glovebox, airflow up to 40 cm/s", "2010-2022 (PSI record)", "solid",
        ["PMMA", "fabrics", "cellulose"], "Rods, spherical sections, slabs, films and fabric sheets",
        "Study ignition, flame growth, flame spread and extinction limits of solid fuels in low-velocity forced flows in microgravity and begin bridging NASA-STD-6001 Test 1, ground microgravity tests and real microgravity flammability.",
        "Fuel samples in a small wind tunnel in the MSG with crew support; oxygen varied below 21 percent by adding nitrogen; opposed and concurrent flow.",
        cond([15, 21], None, [0.4, 8], ["N2 (to reduce O2)"], MG, ["psi-25", "bass2-sci-rep-2018", "ferkul-2016-ices"]),
        "flow speed and direction, O2 concentration, sample geometry", None,
        ["flame appearance", "flame growth", "spread rate", "CO2 and CO sensor readings"], ["prevention", "detection"],
        "Reduced-O2 flammability limits; tests Test 1 assumptions but no lunar-pressure or elevated-O2 data.",
        [26], [], ["psi-25", "olson-2017-pmma", "bass2-sci-rep-2018", "ferkul-2016-ices", "olson-2019-bass2"], 130, "high"))
    L.append(inv(26, "BASS", "Burning and Suppression of Solids (BASS)", "flight", "ISS Microgravity Science Glovebox (MSG)",
        "Small flow duct, 76 mm by 76 mm cross section, airflow up to 40 cm/s", "2009-2013 (PSI record)", "solid",
        ["cotton-fiberglass fabric (SIBAL)", "Nomex", "Ultem", "PMMA"], "Fabrics, spheres and cylinders, with igniter wire",
        "Bridge the gap between NASA-STD-6001 Test 1, ground microgravity tests and real microgravity flammability, including wake flames, and assess an inert gaseous extinguishing agent over different materials, geometries, preheating and flow.",
        "Samples in a flow duct in the MSG ignited with a Kanthal wire; fan airflow in opposed or concurrent direction; flame size, shape, colour, spread rate and quenching recorded.",
        cond(None, None, None, ["N2 (suppressant)"], MG, ["psi-26"]),
        "flow direction and speed, material, geometry, suppressant", None,
        ["flame size", "flame shape", "flame colour", "spread rate", "quenching"], ["prevention", "suppression"],
        "Direct test of Test 1 conservatism and nitrogen suppression in microgravity; ambient conditions not stated on the PSI page.",
        [107, 25], [], ["psi-26", "olson-2008-tm"], 123, "high"))
    L.append(inv(39, "CFI", "Cool Flames Investigation (CFI)", "flight", "ISS Combustion Integrated Rack (CIR)",
        "Multi-User Droplet Combustion Apparatus (MDCA)", "2020-2021 (PSI record)", "liquid",
        ["n-dodecane", "n-dodecane/iso-dodecane mixtures", "farnesane"], "Fiber-tethered or suspended droplets",
        "Examine combustion of n-dodecane and its mixtures at pressures of 0.25 to 5 atm, analyse helium dilution effects on cool flames, and relate droplet size, pressure and extinction, including soot formation during cool-flame combustion.",
        "Droplets dispensed in the MDCA chamber with a hot-wire igniter; gas mixtures diluted with oxygen, nitrogen and helium; black-and-white, UV (OH*) and high-resolution cameras plus radiometers.",
        cond(None, [atm(0.25), atm(5)], None, ["He", "N2"], MG, ["psi-39"]),
        "pressure, He dilution, fuel mixture, droplet size", None,
        ["droplet size", "OH* emission", "flame size", "flame radiation"], ["prevention", "detection"],
        "Cool flames may persist after a hot flame extinguishes; chamber O2 values are not stated on the PSI page.",
        [69], [], ["psi-39", "nayagam-2012-cool"], 88, "high"))
    L.append(inv(47, "DAFT", "Dust and Aerosol Measurement Feasibility Test / DAFT-2", "flight", "International Space Station", "Modified TSI P-Trak particle counter with DustTrak control, Mylar aerosol bags",
        "2003-2009 (PSI record)", "solid", ["Arizona Red Dust aerosol (no combustion)"], "Aerosol standard in 15 L bags",
        "Mitigate the risk for SAME by demonstrating that a modified TSI P-Trak counts aerosol correctly in microgravity, comparing it with the DustTrak, and creating aerosol standards.",
        "Modified P-Trak using capillary action to recycle isopropanol; Arizona Red Dust aerosolized with GN2 and measured on orbit against the DustTrak.",
        cond(None, None, None, [], MG, ["psi-47"]), None, None, ["particle counts"], ["detection"],
        "Instrument feasibility for smoke detection; no combustion conditions.", [102], [], ["psi-47"], 3, "high"))
    L.append(inv(68, "FLEX-2", "Flame Extinguishment Experiment-2 (FLEX-2)", "flight", "ISS Combustion Integrated Rack (CIR)",
        "Multi-User Droplet Combustion Apparatus (MDCA)", "to 2019 (PSI record)", "liquid", ["bi-component fuel droplets"], "Free or fiber-supported droplets, single and binary arrays",
        "Extend FLEX to fuels and conditions that mimic real combustors and provide benchmark data on bi-component droplet combustion, including flame extinction boundaries, soot formation and droplet interactions.",
        "Chamber filled to 0.5 to 3.0 atm with O2 mole fraction 0.1 to 0.4 and diluent gas balance; droplet deployed, ignited and tracked with high-speed and colour video.",
        cond([10, 40], [atm(0.5), atm(3.0)], None, [], MG, ["psi-68"]),
        "fuel, ambient gas composition, pressure, droplet diameter, droplet velocity, droplet spacing", None,
        ["flame extinction", "soot", "burning rate"], ["suppression", "prevention"],
        "Extinction boundaries across 10 to 40 percent O2 and 0.5 to 3 atm; diluent species not stated on the page.",
        [69], [], ["psi-68"], 9, "high"))
    L.append(inv(69, "FLEX", "Flame Extinguishment Experiment (FLEX)", "flight", "ISS Combustion Integrated Rack (CIR)",
        "Multi-User Droplet Combustion Apparatus (MDCA)", "2007-2016 (PSI record)", "liquid", ["methanol", "n-heptane", "n-octane", "n-decane"], "Free and fiber-supported droplets",
        "Map flammability limits of liquid fuels in microgravity, measure the effectiveness of CO2, He and SF6 suppressants, and develop predictive models for combustion limits under reduced gravity.",
        "Determine the limiting oxygen index (LOI) as a function of pressure (0.5 to 1.5 atm) and suppressant by repeating droplet tests at progressively lower ambient O2 until droplets fail to ignite.",
        cond([12, 30], [atm(0.5), atm(1.5)], None, ["CO2", "He", "SF6", "N2"], MG, ["psi-69", "nayagam-2013-loi"]),
        "pressure, O2 mole fraction, suppressant and concentration, droplet size", None,
        ["burning rate", "extinction diameter", "heat radiation", "soot", "temperature"], ["suppression", "prevention"],
        "Gives inert-diluent suppressant effectiveness; LOI at the 8.2 psia exploration pressure is not reported.",
        [39, 68], [], ["psi-69", "nayagam-2013-loi", "dietrich-2014-flex", "dietrich-2015-tp"], 284, "high"))
    L.append(inv(98, "SAFFIRE-I", "Spacecraft Fire Safety Experiment-I (SAFFIRE-I)", "flight", "Cygnus resupply vehicle after ISS departure",
        "Saffire flight unit with sample card in a large flow duct", "2016", "solid", ["SIBAL cotton-fiberglass fabric"], "Fabric 0.94 m long by 0.4 m wide",
        "Determine how rapidly a large-scale fire grows in low gravity and investigate low-g flammability limits compared with NASA's normal-gravity screening test.",
        "Large SIBAL sample ignited in a duct with fans at 20 cm/s; cameras, thermocouples, radiometers, O2 and CO2 sensors and anemometers; data compressed and downlinked.",
        cond([21.5, 21.5], [14.7, 14.7], [20, 20], [], "microgravity (free-flying spacecraft)", ["psi-98", "ferkul-2017-saffire"]),
        "none (single burn)", "flow 20 cm/s, SIBAL fabric", ["flame images", "temperature", "radiation", "O2 and CO2 mole fractions", "flow velocity"], ["prevention"],
        "Largest-scale microgravity fabric fire; shows steady spread and flame length in air.",
        [99, 100, 26], [], ["psi-98", "ferkul-2017-saffire", "urban-2017-asgsr", "urban-2019-cf"], 5, "high"))
    L.append(inv(99, "SAFFIRE-II", "Spacecraft Fire Experiment-II (SAFFIRE-II)", "flight", "Cygnus resupply vehicle after ISS departure",
        "Saffire flight unit, sample card of nine 5 by 29 cm samples", "2016-2017 (PSI record)", "solid",
        ["SIBAL", "silicone", "PMMA", "Nomex", "PMMA with Nomex"], "Nine samples of 5 by 29 cm",
        "Determine how rapidly a large-scale fire grows in low gravity and investigate low-g flammability limits compared with NASA's normal-gravity test.",
        "Sample card with nine samples in a flow duct at 20 or 30 cm/s, concurrent or opposed, depending on material; same instrumentation as Saffire-I.",
        cond([22.1, 22.1], None, [20, 30], [], "microgravity (free-flying spacecraft)", ["psi-99", "urban-2017-asgsr"]),
        "material, flow speed and direction", None, ["flame images", "temperature", "radiation", "O2 and CO2"], ["prevention"],
        "Multi-material flammability in microgravity at slightly elevated O2.", [98, 100], [], ["psi-99", "urban-2017-asgsr"], 16, "high"))
    L.append(inv(100, "SAFFIRE-III", "Spacecraft Fire Experiment-III (SAFFIRE-III)", "flight", "Cygnus resupply vehicle after ISS departure",
        "Saffire flight unit with large flow duct", "2017", "solid", ["SIBAL cotton-fiberglass fabric"], "Fabric 0.94 m by 0.4 m",
        "Determine how rapidly a large-scale fire grows in low gravity and investigate low-g flammability limits compared with NASA's normal-gravity test.",
        "SIBAL sample as in Saffire-I but at a higher flow velocity, concurrent or opposed; cameras, thermocouples, radiometers and gas sensors.",
        cond([21.5, 21.5], [14.7, 14.7], [25, 30], [], "microgravity (free-flying spacecraft)", ["psi-100", "ferkul-2017-saffire", "urban-2017-asgsr"]),
        "flow velocity and direction", "SIBAL fabric", ["flame images", "temperature", "radiation", "O2 and CO2"], ["prevention"],
        "Shows flame spread rate and steady flame length at a higher flow; PSI page states 30 cm/s, the paper table 25 cm/s.",
        [99, 98], [], ["psi-100", "ferkul-2017-saffire", "urban-2017-asgsr"], 3, "high"))
    L.append(inv(101, "SAME-R", "Smoke Aerosol Measurement Experiment - Reflight (SAME-R)", "flight", "ISS Microgravity Science Glovebox (MSG)",
        "SAME hardware with a new M-pass instrument", "2010", "solid", ["Pyrell intumescent foam", "Teflon", "Kapton", "cotton", "silicone rubber"], "Heated samples of spacecraft materials",
        "Quantify the particle sizes that smoke achieves in low gravity and relate them to smoke generation and transport conditions.",
        "SAME hardware with Pyrell foam replacing DBP, higher heating temperatures and no-flow heating; 66 test points were flown July 16 to September 9, 2010.",
        cond(None, None, None, [], MG, ["psi-101"]), "heating temperature, flow", None, ["smoke particle size distribution", "detector response"], ["detection"],
        "Smoke size data for spacecraft detector design; ambient O2 and pressure not stated on the PSI page.", [102], [], ["psi-101", "urban-2009-same", "same2-ntrs"], 66, "high"))
    L.append(inv(102, "SAME", "Smoke and Aerosol Measurement Experiment (SAME)", "flight", "ISS Microgravity Science Glovebox (MSG)",
        "Near-field hardware, far-field box, thermophoretic samplers and two smoke detectors", "2007 (flight)", "solid", ["heated spacecraft materials"], "Overheated spacecraft materials",
        "Quantify the sizes liquid smoke particulate achieves in low gravity and relate droplet size distribution to smoke generation and transport; develop a code to predict droplet growth.",
        "Crew installed hardware in the glovebox; igniter on for 15 to 60 s; thermophoretic soot samplers analysed after flight by TEM; detector response recorded from video.",
        cond(None, None, None, [], MG, ["psi-102"]), "sample temperature, flow field, particle ageing time", None, ["smoke particle size", "mass loss", "detector response"], ["detection"],
        "Smoke particle size baseline for detector design.", [101], [], ["psi-102", "urban-2009-same"], None, "high"))
    return L


def main():
    findings = {f["id"]: f for f in load("findings.json")}
    L = build()
    order = [159, 10, 21, 22, 23, 106, 107, 117, 62, 60, 142, 115, 20, 25, 26, 39, 47, 68, 69, 98, 99, 100, 101, 102]
    by = {int(i["id"].split("-")[1]): i for i in L}
    out = []
    for n in order:
        i = by[n]
        i["findings"] = [findings[x] for x in FIND_MAP.get(i["id"], []) if x in findings]
        out.append(i)
    dump("investigations.json", out)
    print("investigations", len(out))


if __name__ == "__main__":
    main()
