function optimize() {
    var students = parseInt(document.getElementById("students").value)
    var t = parseFloat(document.getElementById("t").value)
    var ft = parseFloat(document.getElementById("ft").value)
    var stars = parseFloat(document.getElementById("stars").value)

    var theories = parseFloat(document.getElementById("theories").value)
    var theoryBoosts = parseFloat(document.getElementById("theoryboosts").value)

    var adBonus = document.getElementById("adbonus").checked
    var ignoreTheories = document.getElementById("ignoretheories").checked
    var acceleration = document.getElementById("acceleration").checked
    var accelerationBonus = parseFloat(document.getElementById("accelmult").value)
    
    if(isNaN(accelerationBonus))
        accelerationBonus = 2.8538;

    if(isNaN(theories))
        theories = 0;
    if(isNaN(theories))
        theoryBoosts = 0;


    var log10dmu = ft
    if (ft < 100) {
        //More accurate calculations
        var db = Math.pow(Math.pow(10,ft),0.8) / 4000000
        var log10db = Math.log10(db+10)
        var dpsi = Math.pow(2,(ft/25)-1) - 0.5
        var log10dpsi = Math.log10(dpsi+10)
    } else{
        //Less accurate but works for higher ft
        var log10db = (ft * 0.8) - Math.log10(4e6)
        var log10dpsi = (ft / 25.0 - 1) * Math.log10(2)
    }  

    var dtSpeedUpgrades = ft / (15.0 * Math.log10(2))
    var dtSpeed = (dtSpeedUpgrades + 0.1) / 10
    var dtLevels = ft / Math.log10(4)
    var dt = dtSpeed * dtLevels

    if (adBonus) { dt *= 1.5 }
    if (acceleration) { dt *= accelerationBonus }


    function getCost(num) {
        if (num % 2 === 1) {
            return (Math.pow(num, 2) - 1) / 4 + (num + 1) / 2
        } else {
            return (Math.pow(num, 2) + 2 * num) / 4
        }
    }

    function getNextCost(num) {
        return getCost(num+1) - getCost(num);
    }

    function getCostOrder(order) {
        cost = 0;
        for (var i = 0; i < order.length-1; i++) {
            cost += getCost(order[i]);
        }
        cost += 2*order[6]
        return cost
    }

    var boosts = [
        Math.log10(dt),
        0.7 * Math.log10(1 + t),
        Math.log10(1 + stars),
        log10db / Math.sqrt(100 * log10db),
        log10dmu / 1300.0,
        log10dpsi / 225 * Math.sqrt(log10dpsi),
        0.1
    ]

    function getTotalBoost(order) {
        res = 0
        for (var i = 0; i < order.length-1; i++) {
            res += order[i]*boosts[i]
        }
        return (1+order[6]*0.1)*res
    }

    var order = [0, 0, 0, 0, 0, 0, 0]

    var studentCosts = [[20, 5, 5, 5, 5, 5, 5, 5, 40], [10, 10, 10]]
    var tempStudents = students;
    theories = Math.min(theories,studentCosts[0].length)
    theoryBoosts = Math.min(theoryBoosts, studentCosts[1].length)

    if (!ignoreTheories) {
        for (var i = 0; i < theories; i++) {
            tempStudents -= studentCosts[0][i]
        }
        if (theories >= 8) {
            for (var j = 0; j < theoryBoosts; j++) {
                tempStudents -= studentCosts[1][j]
            }
        }
        else if (theoryBoosts > 0) {
            console.log("Theory Speed upgrades will be ignored as Theory 8 has not been bought")
        }
    }
    if (tempStudents < 0) {
        console.log("Not enough students for given Theories, continuing with IgnoreTheories assumed True")
        ignoreTheories = true
    } else {
        students = tempStudents
    }

    function getBestTotal(order, totalStudents, highest = [0,0,0,0,0,0,0]) {
        var remainingStudents = totalStudents - getCostOrder(order)
        var bestBoostPerCost = 0
        var bestI = -1
        for (var i = 0; i < order.length; i++) {
            if ((i >= 3 && i < 6 && order[i] === 8) || (i === 6 && order[i] === 6)) {
                continue
            }
            var boostPerCost = 0;
            var cost = 0;
            if (i === 6) {
                bestPerCost = 0.05 * (
                    order[0] * boosts[0] + order[1] * boosts[1] + order[2] * boosts[2] +
                    order[3] * boosts[3] + order[4] * boosts[4] + order[5] * boosts[5]
                )
                cost = 2
            }
            else {
                cost = getNextCost(order[i])
                extraBoost = (1 + order[6] * boosts[6]) * boosts[i]
                bestPerCost = extraBoost / cost
            }
            if (bestPerCost > bestBoostPerCost) {
                if (cost > remainingStudents) {
                    continue
                }
                bestBoostPerCost = bestPerCost
                bestI = i
                bestCost = cost
            }
        }
        if (bestI !== -1) {
            order[bestI] += 1
            if (getTotalBoost(order) > getTotalBoost(highest)) {
                highest = order.slice()
            }
            return [order, totalStudents, highest]
        }
        else {
            return [order, 0, highest]
        }
    }

    var tempStudents = students
    var highest = order.slice()
    while (tempStudents > 0) {
        var res = getBestTotal(order, tempStudents, highest)
        order = res[0]
        tempStudents = res[1]
        highest = res[2]
    }

    function contains(arrayOfArrays, searchArray) {
        var res = false
        for (var i = 0; i < arrayOfArrays.length; i++) {
            var array1 = arrayOfArrays[i]
            res = array1.length === searchArray.length && array1.every(function(value, index) { return value === searchArray[index]})
            if (res) {
                return true
            }
        }
        return false

    }

    function getAllForks(order, students, highest, required = [0,0,0,0,0,0,0]){
        var maxBuy = [-1, -1, -1, 8, 8, 8, 6]
        var tmp = []
        for (var i = 0; i < order.length; i++) {
            tmp1 = order.slice()
            tmp1[i] = order[i] +1
            if (maxBuy[i] > 0) {
                tmp1[i] = Math.min(maxBuy[i], tmp1[i])
            }
            if (getTotalBoost(tmp1) < getTotalBoost(highest)) {
                continue
            }
            tmp2 = required.slice()
            tmp2[i] = order[i]+1
            if (maxBuy[i] > 0) {
                tmp2[i] = Math.min(maxBuy[i], tmp2[i] )
            }
            if (getCostOrder(tmp2) > students) {
                continue
            }
            if (!contains(tmp,tmp2)) {
                tmp.push(tmp2)
            }
        }
        return tmp
    }

    var possibles = getAllForks(highest, students, highest)
    var done_possibles = []

    while (possibles.length > 0) {
        var possible = possibles.shift()
        done_possibles.push(possible.slice())
        order = possible.slice()
        total_students = students
        while (total_students > 0) {
            var res = getBestTotal(order, total_students, highest)
            order = res[0]
            total_students = res[1]
            highest = res[2]
        }
        tmp_possibles = getAllForks(order, students, highest, possible)
        for (var tmp_possible_i = 0; tmp_possible_i < tmp_possibles.length; tmp_possible_i++) {
            var tmp_possible = tmp_possibles[tmp_possible_i]
            if (contains(possibles, tmp_possible) || contains(done_possibles,tmp_possible)) {
                continue
            }
            else {
                possibles.push(tmp_possible)
            }
        }
    }
    order = highest

    var phi = (
        (1 + order[6] * boosts[6]) *
        (
            order[0] * boosts[0] + order[1] * boosts[1] + order[2] * boosts[2] +
            order[3] * boosts[3] + order[4] * boosts[4] + order[5] * boosts[5]
        )
    )
    var phiDigits = Math.pow(10, phi - Math.floor(phi))

    var bonusText = ""
    if (ignoreTheories) {
        bonusText += " (Theories ignored)"
    }

    document.getElementById("output").innerHTML = (
        /*
        "Students: " + students + "<br>t: " + t + "<br>f(t): ee" + ft +
        "<br>Stars: " + stars + "<br>Ad-bonus: " + adBonus +
        "<br>Acceleration: " + acceleration + " and " + accelerationBonus + "x" +
        "<br>" +
        */
        "Calculated dt: " + dt.toPrecision(3) + "<br>Phi: " + phiDigits.toPrecision(3) + "e" + Math.floor(phi) +
        "<br>Student distribution: " + order.join(", ") + "<br>Total Students Spent: " + getCostOrder(order) + bonusText
    )
}
