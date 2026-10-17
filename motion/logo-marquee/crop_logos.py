import sys, os
from PIL import Image, ImageOps
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("L")
names = [["oatside","blackmores","the-ordinary","yoga-movement","strong-pilates"],
         ["sebamed","dettol","hada-labo","melano-cc","shiseido-professional"],
         ["schwarzkopf-professional","flexar","mbold","urban-company","sunday"]]
rows = [(20,170),(170,315),(315,470)]
cols = [(20,350),(350,690),(690,1030),(1030,1340),(1340,1720)]
for r,(y0,y1) in enumerate(rows):
    for c,(x0,x1) in enumerate(cols):
        cell = im.crop((x0,y0,x1,y1))
        # background is ~#2b2a2a (43); map 43..255 to alpha 0..255
        alpha = cell.point(lambda v: 0 if v < 60 else min(255, int((v-43)*255/(255-43))))
        box = alpha.point(lambda v: 255 if v > 40 else 0).getbbox()
        a = alpha.crop(box)
        a = a.crop((-2,-2,a.width+2,a.height+2))  # small pad
        logo = Image.new("LA", a.size, 255); logo.putalpha(a)
        p = os.path.join(out, names[r][c] + ".png"); logo.save(p, optimize=True)
        print(names[r][c], logo.size, os.path.getsize(p))
