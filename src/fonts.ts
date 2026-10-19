import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled locally (public/fonts) so rendering doesn't depend on the network.
const pending: Promise<unknown>[] = [];

const load = (family: string, file: string, weight: string) => {
  if (typeof document === "undefined") return family;
  const handle = delayRender(`font ${family}`);
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight });
  const p = face
    .load()
    .then(() => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  pending.push(p);
  return family;
};

export const anton = load("Anton", "Anton.ttf", "400");
export const mono = load("JetBrains Mono", "JetBrainsMono-500.ttf", "500");
export const nunito = load("Nunito", "Nunito-900.ttf", "900");

export const fontsLoaded = () => Promise.all(pending);
