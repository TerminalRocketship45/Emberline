import json
import os
import re
from common import TEXT, dump, load, PAGE_IDS

SECTIONS = ["Objectives", "Approach", "Hypothesis", "Research Impacts/Earth Benefits"]
NOISE = re.compile(
    r"^(notifications|share|info|menu|menu_open|table_view|menu_book|pallet|image|sim_card_download|search|cloud_download|folder_zipDownload|view_timeline|Cite this Investigation|Description|Physical Sciences Informatics|Home|Contact Us|Data & Tools|Search Bar|Publications|Version History|Your download.*|know if there.*|NASA PSI: PSI-\d+|https://psi\.nasa\.gov.*|\d+/\d+|\d+/\d+/\d+, .*|Experimental Table|Modeling Table|Read Me|Hardware|Representative Ima.*|Data files and docu.*|Identifier|Filter|Select Experimental Table|Items per page:|Selected: \d+|Science Documents|Engineering Documents|Presentations|Experimental table|CONTACTS|NASA Official:.*|SITE INFORMATION|OTHER RESOURCES|NASA Privacy.*|PSI|NASA BPS|NASA|\||No Fear Act|FOIA|USA\.gov|Accessibility|Show.*|Selected Version|Changes:.*|\W+)$"
)
SHORT = {20: "BRE", 25: "BASS-II", 26: "BASS", 39: "CFI", 47: "DAFT", 68: "FLEX-2", 69: "FLEX", 98: "SAFFIRE-I", 99: "SAFFIRE-II", 100: "SAFFIRE-III", 101: "SAME-R", 102: "SAME", 159: "CFI-G"}


def clean_lines(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        lines = [l.rstrip() for l in f]
    return [l for l in lines if l.strip() and not NOISE.match(l.strip())]


def sections(lines):
    out = {}
    cur = None
    for l in lines:
        s = l.strip()
        if s in SECTIONS:
            cur = s
            out[cur] = []
            continue
        if s.startswith("Contact(s)"):
            cur = None
            continue
        if cur:
            out[cur].append(s)
    return {k: " ".join(v) for k, v in out.items()}


def publications(lines):
    idx = [i for i, l in enumerate(lines) if l.strip().startswith("Authors:")]
    if not idx:
        return ""
    start = max(0, idx[0] - 1)
    if start > 0 and len(lines[start].strip()) < 55 and not lines[start - 1].strip().startswith("DOI:"):
        start -= 1
    end = len(lines)
    for i in range(idx[-1], len(lines)):
        if lines[i].strip().startswith("Version ") or lines[i].strip().startswith("Updated Date"):
            end = i
            break
    return " ".join(l.strip() for l in lines[start:end]).replace("Experimental table ", "", 1)


def split_sentences(text):
    parts = re.split(r"(?<=[.;:])\s+(?=[A-Z0-9(])", text)
    return [p for p in parts if p]


def chunk(text, lo=500, hi=900):
    out = []
    cur = ""
    for s in split_sentences(text):
        if cur and len(cur) + len(s) + 1 > hi and len(cur) >= lo:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        if out and len(cur) < 250:
            out[-1] = out[-1] + " " + cur
        else:
            out.append(cur)
    return out


def main():
    corpus = []
    for n in PAGE_IDS:
        path = os.path.join(TEXT, "psi-%d.txt" % n)
        lines = clean_lines(path)
        sec = sections(lines)
        k = 0
        for name in SECTIONS:
            if name not in sec:
                continue
            for c in chunk(sec[name]):
                k += 1
                corpus.append({"id": "psi-%d-c%d" % (n, k), "investigationId": "PSI-%d" % n, "sourceId": "psi-%d" % n,
                               "title": "%s: %s" % (SHORT[n], name), "text": c})
        pubs = publications(lines)
        pubs = re.sub(r"\s+", " ", pubs)
        for c in chunk(pubs, 400, 900)[:4]:
            k += 1
            corpus.append({"id": "psi-%d-c%d" % (n, k), "investigationId": "PSI-%d" % n, "sourceId": "psi-%d" % n,
                           "title": "%s: Publications and data" % SHORT[n], "text": c})
    invs = load("investigations.json")
    for i in invs:
        if i["sourceIds"][0] == "psi-%s" % i["id"].split("-")[1] and int(i["id"].split("-")[1]) in PAGE_IDS:
            continue
        best = [s for s in i["sourceIds"] if not s.startswith("psi-")]
        sid = best[0] if best else i["sourceIds"][0]
        fnd = " ".join(f["text"] for f in i["findings"])
        txt = "%s (%s), %s investigation on %s. Objective: %s Fuel type: %s. Confidence: %s. %s Habitat relevance: %s" % (
            i["name"], i["id"], i["kind"], i["platform"], i["objective"], i["fuelType"], i["confidence"], fnd, i["habitatRelevance"] or "not reported")
        corpus.append({"id": "%s-summary" % i["id"].lower(), "investigationId": i["id"], "sourceId": sid,
                       "title": "%s: summary" % i["short"], "text": txt.strip()})
    invmap = {}
    for i in invs:
        for f in i["findings"]:
            invmap.setdefault(f["id"], i["id"])
    for f in load("findings.json"):
        txt = f["text"] + ((" Key value: " + f["value"] + ".") if f["value"] else "")
        corpus.append({"id": "chunk-" + f["id"], "investigationId": invmap.get(f["id"]), "sourceId": f["sourceIds"][0],
                       "title": "Finding: " + f["id"][2:].replace("-", " "), "text": txt})
    ids = [c["id"] for c in corpus]
    assert len(ids) == len(set(ids))
    dump("corpus.json", corpus)
    print("corpus", len(corpus))


if __name__ == "__main__":
    main()
