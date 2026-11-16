from common import dump, PSI_BASE, PAGE_IDS, ALL_IDS

PSI_TITLES = {
    20: ("ACME BRE: Burning Rate Emulator", "10.60555/vb93-3y72"),
    25: ("BASS-II: Burning and Suppression of Solids II", "10.60555/4qc4-de67"),
    26: ("BASS: Burning and Suppression of Solids", "10.60555/58h4-dy80"),
    39: ("CFI: Cool Flames Investigation", "10.60555/m6pj-a914"),
    47: ("DAFT / DAFT-2: Dust and Aerosol Measurement Feasibility Test", "10.60555/ztgj-d202"),
    68: ("FLEX-2: Flame Extinguishment Experiment-2", "10.60555/byp8-h018"),
    69: ("FLEX: Flame Extinguishment Experiment", "10.60555/mbq8-0451"),
    98: ("SAFFIRE-I: Spacecraft Fire Safety Experiment-I", "10.60555/0t15-1z43"),
    99: ("SAFFIRE-II: Spacecraft Fire Experiment-II", "10.60555/2chp-m469"),
    100: ("SAFFIRE-III: Spacecraft Fire Experiment-III", "10.60555/040q-4h36"),
    101: ("SAME-R: Smoke Aerosol Measurement Experiment-Reflight", "10.60555/2np7-jv14"),
    102: ("SAME: Smoke and Aerosol Measurement Experiment", "10.60555/gd4k-8h62"),
    159: ("ACME CFI-G: Cool Flames Investigation with Gases", "10.60555/cyt1-kh64"),
    10: ("ACME Flame Design", None),
    21: ("ACME CLD Flame: Coflow Laminar Diffusion Flame", None),
    22: ("ACME E-FIELD Flames", None),
    23: ("ACME s-Flame: Structure and Response of Spherical Flames", None),
    106: ("SLICE: Structure and Liftoff in Combustion Experiment", None),
    107: ("SPICE: Smoke Point In Coflow Experiment", None),
    117: ("OpenFOAM cool flame CFD using FLEX data", None),
    62: ("FGM concurrent flame spread compared with BASS", None),
    60: ("SPICE soot analysis", None),
    142: ("Cool flame counterflow extinction using FLEX", None),
    115: ("SAME smoke simulation", None),
}


def psi_source(n):
    title, doi = PSI_TITLES[n]
    return {
        "id": "psi-%d" % n,
        "title": "NASA PSI-%d: %s" % (n, title),
        "authors": None,
        "year": None,
        "venue": "NASA Physical Sciences Informatics (PSI)",
        "url": PSI_BASE + str(n),
        "doi": doi,
        "kind": "psi",
    }


def src(id, title, authors, year, venue, url, doi, kind):
    return {"id": id, "title": title, "authors": authors, "year": year, "venue": venue, "url": url, "doi": doi, "kind": kind}


OTHERS = [
    src("challenge-2026", "Flame in Freefall: NASA Space Apps Challenge 2026 challenge statement", None, 2026, "NASA Space Apps Challenge", "https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/", None, "challenge"),
    src("ferkul-2026-lpsc", "Material Flammability at Lunar and Martian Gravity (LPSC 2026)", "Ferkul, Kralik, Liao, Johnston", 2026, "Lunar and Planetary Science Conference 2026", "https://ntrs.nasa.gov/citations/20260001966", None, "paper"),
    src("norcross-2015-hypoxia", "Hypoxia evidence report (exploration atmosphere history)", "Norcross et al.", 2015, "NASA NTRS 20150021491", "https://ntrs.nasa.gov/citations/20150021491", None, "report"),
    src("olson-2008-tm", "Material flammability in microgravity and partial-pressure atmospheres (NASA/TM-2008-215260, SAE 2008-01-2055)", "Olson, Ruff, Miller", 2008, "NASA/TM-2008-215260", "https://ntrs.nasa.gov/citations/20080034883", None, "report"),
    src("urban-2017-asgsr", "Saffire: results from the first three flights (ASGSR 2017, Table 1)", "Urban et al.", 2017, "ASGSR 2017", "https://ntrs.nasa.gov/citations/20180005168", None, "paper"),
    src("ferkul-2017-saffire", "The Saffire Experiment: Large-Scale Combustion aboard Spacecraft", "Ferkul et al.", 2017, "10th US National Combustion Meeting", "https://www.pure.ed.ac.uk/ws/files/31828517/The_Saffire_Experiment_2017_US_National_Meeting_Final.pdf", None, "paper"),
    src("urban-2019-cf", "Flame spread: Effects of microgravity and scale", "Urban et al.", 2019, "Combustion and Flame 199, 168-182", "https://www.research.ed.ac.uk/en/publications/flame-spread-effects-of-microgravity-and-scale/", None, "paper"),
    src("harper-2016-moc", "Maximum oxygen concentration and flammability: oxygen concentration versus partial pressure (ASTM symposium)", "Harper, Juarez, Perez, Hirsch, Beeson", 2016, "ASTM symposium 2016", "https://ntrs.nasa.gov/citations/20160001047", None, "paper"),
    src("hirsch-2010", "Flammability of non-metallic materials in low-pressure oxygen", "Hirsch et al.", 2010, "NASA NTRS 20100015582", "https://ntrs.nasa.gov/citations/20100015582", None, "report"),
    src("olson-2014-nulp", "Normoxic Upward Limiting Pressure (ICES-2014-179)", "Olson, Beeson, Fernandez-Pello", 2014, "ICES-2014-179", "https://ntrs.nasa.gov/citations/20150004099", None, "paper"),
    src("nayagam-2013-loi", "Methanol droplet limiting oxygen index in FLEX", "Nayagam, Dietrich, Hicks, Williams", 2013, "8th US National Combustion Meeting", "https://ntrs.nasa.gov/citations/20130014061", None, "paper"),
    src("dietrich-2014-flex", "Droplet combustion experiments aboard the ISS", "Dietrich et al.", 2014, "Microgravity Science and Technology 26", None, "10.1007/s12217-014-9372-2", "paper"),
    src("dietrich-2015-tp", "FLEX report NASA/TP-2015-216046", "Dietrich et al.", 2015, "NASA/TP-2015-216046", "https://ntrs.nasa.gov/citations/20150023456", None, "report"),
    src("nayagam-2012-cool", "Cool flames in droplet combustion aboard the ISS", "Nayagam, Dietrich, Ferkul, Hicks, Williams", 2012, "Combustion and Flame 159, 3583-3588", None, "10.1016/j.combustflame.2012.07.012", "paper"),
    src("bass2-sci-rep-2018", "Microgravity flammability boundaries of PMMA rods (BASS-II)", None, 2018, "Scientific Reports", None, "10.1038/s41598-017-18398-4", "paper"),
    src("ferkul-2016-ices", "BASS-II results (ICES 2016)", "Ferkul", 2016, "ICES 2016", "https://ntrs.nasa.gov/citations/20160012691", None, "paper"),
    src("olson-2019-bass2", "Flammability Limits from BASS-II Testing in Microgravity Compared to Normal Gravity Limits (ICES-2019)", "Olson et al.", 2019, "ICES-2019", "https://ttu-ir.tdl.org/items/1922ad9f-ef4c-4f52-96a4-980c23debe5e", None, "paper"),
    src("olson-2017-pmma", "Microgravity flammability boundary for PMMA rods in axial stagnation flow", "Olson, Ferkul", 2017, "Combustion and Flame", None, "10.1016/j.combustflame.2017.03.001", "paper"),
    src("urban-2009-same", "Smoke Particle Sizes in Low-Gravity and Implications for Spacecraft Smoke Detector Design (SAE 2009-01-2468)", "Urban et al.", 2009, "SAE 2009-01-2468", "https://www.nist.gov/node/1863886", None, "paper"),
    src("same2-ntrs", "SAME-2 smoke particle results", "Urban et al.", 2013, "NASA NTRS 20130000422", "https://ntrs.nasa.gov/citations/20130000422", None, "report"),
    src("dehghani-2021-umd", "Burning in microgravity: Experimental results and analysis (BRE)", "Dehghani, Sunderland, Quintiere, de Ris", 2021, "Combustion and Flame", None, "10.1016/j.combustflame.2021.01.035", "paper"),
    src("dehghani-diss-umd", "Dehghani PhD dissertation, University of Maryland (BRE flammability map)", "Dehghani", None, "University of Maryland DRUM", "https://drum.lib.umd.edu/handle/1903/29303", None, "paper"),
    src("kim-2023-cfig", "Spherical gas-fueled cool diffusion flames", "Kim, Waddell, Sunderland et al.", 2023, "Proceedings of the Combustion Institute 39, 1647-1656", None, "10.1016/j.proci.2022.07.015", "paper"),
    src("dotson-spice", "Smoke points of microgravity and normal gravity coflow diffusion flames", "Dotson, Sunderland, Yuan, Urban", None, "University of Maryland DRUM", "https://drum.lib.umd.edu/handle/1903/13569", None, "paper"),
    src("debold-spice", "Laminar smoke points of coflowing diffusion flames in microgravity (UMD MS thesis)", "DeBold", 2012, "University of Maryland DRUM", "https://drum.lib.umd.edu/handle/1903/10005", None, "paper"),
    src("ma-2014-slice", "Experimental and computational study of microgravity sooting coflow flames (SLICE)", "Ma, Cao, Giassi, Stocker, Takahashi, Bennett, Smooke, Long", 2014, "NASA NTRS 20140017780", "https://ntrs.nasa.gov/citations/20140017780", None, "paper"),
    src("nasa-acme-article", "Space station's quest for the secrets of fire (NASA ACME article)", None, None, "NASA", "https://www.nasa.gov/humans-in-space/space-stations-quest-for-the-secrets-of-fire/", None, "web"),
    src("nasa-flame-design", "NASA Flame Design investigation page", None, None, "NASA Science", "https://science.nasa.gov/biological-physical/investigations/flame-design/", None, "web"),
    src("nasa-cld-flame", "NASA CLD Flame investigation page", None, None, "NASA Science", "https://science.nasa.gov/biological-physical/investigations/cld-flame/", None, "web"),
    src("nasa-e-field", "NASA E-FIELD Flames investigation page", None, None, "NASA Science", "https://science.nasa.gov/biological-physical/investigations/e-field-flames", None, "web"),
    src("nasa-s-flame", "NASA s-Flame investigation page", None, None, "NASA Science", "https://science.nasa.gov/biological-physical/investigations/s-flame/", None, "web"),
    src("scinapse-flex-cfd", "OpenFOAM cool flame modelling record (FLEX data context)", None, None, "Scinapse", "https://scinapse.io/papers/1974189763", None, "web"),
    src("buffalo-fgm", "Radiative flamelet-generated manifolds for solid fuel flame spread", "Budzinski, Desjardin", None, "University at Buffalo", "https://researchconnect.buffalo.edu/en/publications/radiative-flamelet-generated-manifolds-for-solid-fuel-flame-sprea/", None, "paper"),
    src("princeton-cool-counterflow", "The radical index and the effect of oxygen concentration on non-premixed cool flame extinction", None, None, "Princeton", "https://collaborate.princeton.edu/en/publications/the-radical-index-and-the-effect-of-oxygen-concentration-on-non-p/", None, "paper"),
    src("ntrs-20080012612", "SAME smoke particle and transport background (NTRS 20080012612)", "Urban et al.", 2008, "NASA NTRS", "https://ntrs.nasa.gov/api/citations/20080012612/downloads/20080012612.pdf", None, "report"),
    src("spinoff-air-tanks", "NASA Spinoff: air tanks derived from spacecraft technology", None, None, "NASA Spinoff", "https://spinoff.nasa.gov/node/9582", None, "web"),
    src("spinoff-fire-detector", "NASA Spinoff: fire detector", None, None, "NASA Spinoff", "https://spinoff.nasa.gov/node/9407", None, "web"),
    src("spinoff-firefighter-attire", "NASA Spinoff: firefighter attire", None, None, "NASA Spinoff", "https://spinoff.nasa.gov/node/9918", None, "web"),
    src("nasa-mist", "Fine water mist fire suppression (MIST, NTRS 20040053582)", None, None, "NASA NTRS", "https://ntrs.nasa.gov/citations/20040053582", None, "report"),
]


def main():
    out = [psi_source(n) for n in ALL_IDS] + OTHERS
    ids = [s["id"] for s in out]
    assert len(ids) == len(set(ids))
    dump("sources.json", out)
    print("sources", len(out))


if __name__ == "__main__":
    main()
