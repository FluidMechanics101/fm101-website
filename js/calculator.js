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

function readNumbersCellHeight(form) {

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
    const cf = Math.pow(2.0 * Math.log10(Re) -0.65 , -2.3);
    const tau = cf * 0.5 * rho * Math.pow(U, 2);
    const uTau = Math.sqrt(tau / rho);
    const yTarget = (yPlus * mu)/(rho * uTau);
    const yHTarget = 2.0 * yTarget;

    let delta99 = -1.0;

    // Laminar flow - Blasius Solution
    if (Re < 5e5) {
        delta99 = 4.91 * lScale / Math.sqrt(Re);
    }
    // Turbulent Flow - Cengal and Cimbala, Section 10.6. Table 10.4.
    else {
        delta99 = 0.38 * lScale / Math.pow(Re, 0.2);
    }

    // Use Newton iteration to calculate growth ratio
    let growthRatio = 5;
    let err = 1.0;
    let iterNum = 1;

    while (err > 1e-4 && iterNum < 100) {
        const f = (
            Math.pow(growthRatio, layers)
         - (growthRatio*delta99/yHTarget)
         + ((delta99/yHTarget)-1)
        );

        const df = (
            layers
          * Math.pow(growthRatio, layers-1)
          - (delta99/yHTarget)
        );

        err = f/df;
        growthRatio = growthRatio - err;
        iterNum = iterNum + 1;
    }

    const finalLayer = yHTarget * Math.pow(growthRatio, layers-1)

    form.yH.value = yHTarget.toExponential(2);
    form.finalLayer.value = finalLayer.toExponential(2);
    form.delta99.value = delta99.toExponential(2);
    form.growthRatio.value = growthRatio.toFixed(2);

    return false;
}

function readNumbersHumidity(form){

    const TdegC = parseFloat(form.temperature.value);
    const p = parseFloat(form.pressure.value);
    const rH = parseFloat(form.relativeHumidity.value);

    if (!arePos([TdegC, p, rH])) {
        alert("Please enter positive numbers only");
        return false;
    }

    if (rH > 1) {
        alert("Relative humidity > 1");
        return false;
    }

    if (TdegC < -273.15) {
        alert("Temperature < -273.15C");
        return false;
    }

    let pSat = 0.0;
    if (TdegC > 0) {
        pSat = (
            1000
          * 0.61121
          * Math.exp((18.678 - (TdegC / 234.5)) * (TdegC / (257.14 + TdegC)))
        );
    } else {
        pSat = (
            1000
          * 0.61115
          * Math.exp((23.036 - (TdegC / 333.7)) * (TdegC / (279.82 + TdegC)))
        );
    }

    // Partial pressure of water vapour
    const pV = pSat * rH;

    // Molar masses of air and water vapour [kg/kmol]
    const Mair = 28.97;
    const Mwater = 18.02;

    // Specific and absolute humidity
    const sH = (Mwater/Mair) * (pV / (p - pV));
    const aH = sH / (1 + sH);

    form.specificHumidity.value = sH.toExponential(2);
    form.absoluteHumidity.value = aH.toExponential(2);
    form.massFraction.value = aH.toExponential(2);

    return false;
}

function readNumbersTurbulence(form) {

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

    const k = 1.5* Math.pow(U*0.01*I, 2);
    const Cmu = 0.09;
    const epsilon = Cmu * Math.pow(k, 1.5) / lScale;
    const omega = epsilon / (Cmu * k);
    const nut = k / omega;

    form.k.value = k.toExponential(2);
    form.epsilon.value =  epsilon.toExponential(2);
    form.omega.value = omega.toExponential(2);
    form.nut.value = nut.toExponential(2);

    return false;
}

function readNumbersParticleSettling(form) {

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

    fluid = form.fluidChoice.value;
    let rhof = -1;
    let mu = -1;

    if (fluid == 'Water') {
        rhof = 1000;
        mu = 1e-3;
    }

    if (fluid == 'Air') {
        rhof = 1.225;
        mu = 1.81e-5;
    }

    // Initial guess (Stokes solution, f = 1)
    let f = 1;
    let U = modifiedStokes(d, rhop, rhof, mu, f);
    let Uold = 1.0;
    let Re = rhof * U * d / mu;
    let Cd = schillerNaumann(Re);
    f = Cd * Re / 24;

    // Iteration
    let err = 1.0;
    let iterNum = 1;
    let relax = 0.5

    while (iterNum < 50 && Math.abs(err) > 1e-6) {

        // Relax U for stability
        Uold = U;
        U = modifiedStokes(d, rhop, rhof, mu, f);
        U = (relax * U) + ((1.0 - relax) * Uold)
        Re = rhof * U * d / mu;
        Cd = schillerNaumann(Re);
        f = Cd * Re / 24;

        // Increment counter
        err = U - Uold;
        iterNum = iterNum + 1;
    }

    form.reynoldsNumber.value = Re.toExponential(2);
    form.cd.value = Cd.toFixed(1);
    form.settlingVelocity.value = U.toExponential(2);

    return false;
}

function modifiedStokes(d, rhop, rhof, mu, f){
    return 9.81 * Math.pow(d, 2) * (rhop - rhof) / (18 * mu * f);
}

function schillerNaumann(Re){

    let CdRe = 1.0;
    if (Re <= 1000) {
        CdRe = 1 + 0.15 * Math.pow(Re, 0.687);
    } else {
        CdRe = 0.0183 * Re;
    }

    return CdRe * 24 / Re;
}
