module.exports = (number) => {
    const s = ['', 'K', 'M', 'G', 'T', 'P'];
    const e = Math.floor(Math.log(number) / Math.log(1000));
    return (number / Math.pow(1000, e)).toFixed(e > 0 ? 1 : 0) + s[e];
};
