from data import DISTRICTS, WEIGHTS


def calculate_score(districts: dict) -> dict:
    district_scores = {
        district_name: _calculate_district_score(district["indicators"])
        for district_name, district in districts.items()
    }
    d_avg = sum(
        district_scores[district_name] * district["population_share"]
        for district_name, district in districts.items()
    )
    n_crit = sum(
        1
        for district in districts.values()
        for value in district["indicators"].values()
        if value < 40
    )
    score = 0.7 * d_avg + 0.3 * min(district_scores.values()) - n_crit

    return {
        "district_scores": _round_mapping(district_scores),
        "d_avg": round(d_avg, 2),
        "n_crit": n_crit,
        "score": round(score, 2),
    }


def calculate_baseline_score() -> dict:
    return calculate_score(DISTRICTS)


def _calculate_district_score(indicators: dict[str, float]) -> float:
    return sum(indicators[indicator] * weight for indicator, weight in WEIGHTS.items())


def _round_mapping(values: dict[str, float]) -> dict[str, float]:
    return {key: round(value, 2) for key, value in values.items()}
