def normalize(t):
    import re
    t = t.lower().strip()
    t = re.sub(r'[—–-].*$', '', t)
    t = re.sub(r'\s*\(.*\)\s*$', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()

with open('w1_titles.txt') as f:
    w1 = [line.strip() for line in f]

with open('w2_titles.txt') as f:
    w2 = [line.strip() for line in f]

w1_norm = {normalize(t): t for t in w1}
collisions = []

for t in w2:
    n = normalize(t)
    if n in w1_norm:
        collisions.append((t, w1_norm[n]))

if collisions:
    print("Collisions found:")
    for c in collisions:
        print(f"W2: '{c[0]}' collides with W1: '{c[1]}'")
else:
    print("No collisions found.")
