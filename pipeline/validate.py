import json
import collections
from common import load


def main():
    inv = load("investigations.json")
    src = {s["id"] for s in load("sources.json")}
    hab = load("habitats.json")
    fnd = load("findings.json")
    tst = load("tests.json")
    cor = load("corpus.json")
    ids = [i["id"] for i in inv]
    assert len(inv) == 24 and len(set(ids)) == 24
    for i in inv:
        for s in i["sourceIds"] + i["conditions"]["sourceIds"]:
            assert s in src, (i["id"], s)
        for f in i["findings"]:
            for s in f["sourceIds"]:
                assert s in src, (f["id"], s)
        for r in i["relatedIds"] + i["reusesDataFrom"]:
            assert r in ids, (i["id"], r)
    for f in fnd:
        for s in f["sourceIds"]:
            assert s in src, (f["id"], s)
    for h in hab:
        for s in h["sourceIds"]:
            assert s in src
    for c in cor:
        assert c["sourceId"] in src, c["id"]
        assert c["investigationId"] is None or c["investigationId"] in ids
    assert len({f["id"] for f in fnd}) == len(fnd)
    print("ok", len(inv), len(src), len(hab), len(fnd), len(tst), len(cor))
    print(collections.Counter(i["confidence"] for i in inv))
    for i in inv:
        c = i["conditions"]
        print(i["id"], i["confidence"], c["o2Pct"], c["pressurePsia"], c["flowCmS"], i["testCount"])


if __name__ == "__main__":
    main()
