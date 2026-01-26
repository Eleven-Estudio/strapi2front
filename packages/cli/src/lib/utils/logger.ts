import pc from 'picocolors';

export const logger = {
  info: (message: string) => {
    console.log(pc.blue("i"), message);
  },

  success: (message: string) => {
    console.log(pc.green("v"), message);
  },

  warn: (message: string) => {
    console.log(pc.yellow("!"), message);
  },

  error: (message: string) => {
    console.log(pc.red("x"), message);
  },

  step: (message: string) => {
    console.log(pc.cyan(">"), message);
  },

  dim: (message: string) => {
    console.log(pc.dim(message));
  },

  newLine: () => {
    console.log("");
  },
};
