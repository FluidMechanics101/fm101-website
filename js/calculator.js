// 1. Form validation
function arePos(params) {
    if (!Array.isArray(params) || params.length === 0) {
        return false;
    }

    for (let i = 0; i < params.length; i++) {
        const num = Number(params[i]);

        if (isNaN(num) || !Number.isFinite(num) || num <=0) {
            return false;
        }
    }

    return true;
}

// 2. Core calculation functions
function modifiedStokes(d, rhop, rhof, mu, f){
    return 9.81 * (d ** 2) * (rhop - rhof) / (18 * mu * f);
}

function schillerNaumann(Re){

    // Division by zero catch
    if (Re <= 0) {
        return 0;
    }

    if (Re <= 1000) {
        return (1 + 0.15 * (Re ** 0.687)) * 24 / Re;
    } else {
        return 0.4392;
    }
}

// 3. Form controllers
function cellHeight(form) {

    const U = parseFloat(form.flowVelocity.value);
    const lScale = parseFloat(form.lengthScale.value);
    const mu = parseFloat(form.dynamicViscosity.value);
    const rho = parseFloat(form.density.value);
    const yPlus = parseFloat(form.yPlus.value);
    const layers = parseInt(form.layers.value, 10);

    if (!arePos([U, lScale, mu, rho, yPlus, layers])) {
        alert("Please enter positive numbers only");
        return false;
    }

    if (!Number.isInteger(parseFloat(form.layers.value))) {
        alert("Please enter integer layers");
        return false;
    }

    const Re = rho * U * lScale / mu;
    const cf = (2.0 * Math.log10(Re) -0.65) ** -2.3;
    const tau = cf * 0.5 * rho * (U ** 2);
    const uTau = Math.sqrt(tau / rho);
    const yTarget = (yPlus * mu)/(rho * uTau);
    const yHTarget = 2.0 * yTarget;

    // Laminar flow - Blasius Solution
    // Turbulent Flow - Cengal and Cimbala, Section 10.6. Table 10.4.
    const delta99 = Re < 5e5
          ? 4.91 * lScale / Math.sqrt(Re)
          : 0.38 * lScale / (Re ** 0.2);

    // Use Newton iteration to calculate growth ratio
    let growthRatio = 5;
    let err = 1.0;
    let iterNum = 1;
    const deltaRatio = delta99 / yHTarget;

    while (err > 1e-4 && iterNum < 100) {
        const f = (
            (growthRatio ** layers)
         - (growthRatio * deltaRatio)
         + (deltaRatio - 1)
        );

        const df = (
            layers
          * (growthRatio ** (layers-1))
          - deltaRatio
        );

        err = f / df;
        growthRatio -= err;
        iterNum++;
    }

    const finalLayer = yHTarget * (growthRatio ** (layers - 1));

    form.yH.value = yHTarget.toExponential(2);
    form.finalLayer.value = finalLayer.toExponential(2);
    form.delta99.value = delta99.toFixed(4);
    form.growthRatio.value = growthRatio.toFixed(2);

    return false;
}

function humidity(form){

    const TdegC = parseFloat(form.temperature.value);
    const p = parseFloat(form.pressure.value);
    const rH = parseFloat(form.relativeHumidity.value);

    if (!arePos([p, rH])) {
        alert("Please enter positive numbers only");
        return false;
    }

    if (rH > 1) {
        alert("Relative humidity cannot be > 1");
        return false;
    }

    if (TdegC < -273.15) {
        alert("Temperature cannot be < -273.15C");
        return false;
    }

    // Arden Buck equation
    const pSat = TdegC > 0
          ? (
              611.21
            * Math.exp((18.678 - (TdegC / 234.5))
            * (TdegC / (257.14 + TdegC)))
          )
          : (
              611.15
            * Math.exp((23.036 - (TdegC / 333.7))
            * (TdegC / (279.82 + TdegC)))
          );

    // Partial pressure of water vapour
    const pV = pSat * rH;

    // Molar masses of air and water vapour [kg/kmol]
    const Mair = 28.97;
    const Mwater = 18.02;

    // Specific and absolute humidity
    const sH = (Mwater/Mair) * (pV / (p - pV));
    const aH = sH / (1 + sH);

    form.specificHumidity.value = sH.toFixed(4);
    form.absoluteHumidity.value = aH.toFixed(4);
    form.massFraction.value = aH.toFixed(4);

    return false;
}

function turbulence(form) {

    const U = parseFloat(form.flowVelocity.value);
    const I = parseFloat(form.intensity.value);
    const lScale = parseFloat(form.lengthScale.value);

    if (!arePos([U, I, lScale])) {
        alert("Please enter positive numbers only");
        return false;
    }

    if (I > 100) {
        alert("Turbulence intensity I > 100%");
        return false;
    }

    const k = 1.5 * ((U*0.01*I) ** 2);
    const Cmu = 0.09;
    const epsilon = Cmu * (k ** 1.5) / lScale;
    const omega = epsilon / (Cmu * k);
    const nut = k / omega;

    form.k.value = k.toFixed(4);
    form.epsilon.value = epsilon.toFixed(4);
    form.omega.value = omega.toFixed(4);
    form.nut.value = nut.toFixed(4);

    return false;
}

function particleSettling(form) {

    const d = parseFloat(form.diameter.value);
    const rhop = parseFloat(form.particleDensity.value);

    if (!arePos([d, rhop])) {
        alert("Please enter positive numbers only");
        return false;
    }

    if (d > 0.01) {
        alert("Particle diameter > 1cm");
        return false;
    }

    const fluid = form.fluidChoice.value;
    let rhof = -1;
    let mu = -1;

    switch (fluid){
        case 'Water':
            rhof = 1000;
            mu = 1e-3;
            break;

        case 'Air':
            rhof = 1.225;
            mu = 1.81e-5;
            break;

        default:
            alert("Unknown fluid selected");
            return false;
    }

    // Initial guess (Stokes solution, f = 1)
    let f = 1;
    let U = modifiedStokes(d, rhop, rhof, mu, f);
    let Re = rhof * U * d / mu;
    let Cd = schillerNaumann(Re);
    f = Cd * Re / 24;

    let iterNum = 1;
    const relax = 0.5;

    while (iterNum < 50) {

        // Relax U for stability
        const Uold = U;
        U = modifiedStokes(d, rhop, rhof, mu, f);
        U = (relax * U) + ((1.0 - relax) * Uold);
        Re = rhof * U * d / mu;
        Cd = schillerNaumann(Re);
        f = Cd * Re / 24;

        // Increment counter
        const err = U - Uold;
        if (Math.abs(err) <= 1e-6) break;

        iterNum++;
    }

    form.reynoldsNumber.value = Re.toFixed(2);
    form.cd.value = Cd.toFixed(2);
    form.settlingVelocity.value = U.toExponential(3);

    return false;
}
