import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSimulationData, simulate } from "../api/api";
import demoData from "../demoData.json";
import { initialScores, validateSelection } from "../presentation";
export default function useScenario(navigate) {
  const [data, setData] = useState(demoData);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [activeDistrict, setActiveDistrict] = useState("Нура");
  const [decisions, setDecisions] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const requestVersion = useRef(0);
  const baseline = useMemo(() => initialScores(data), [data]);
  const names = Object.keys(data.districts);
  const district =
    baseline.districts.find((d) => d.name === activeDistrict) ||
    baseline.districts[0];
  const chosen = decisions.map((d) => ({
    ...data.initiatives.find((i) => i.id === d.id),
    district: d.district,
  }));
  const used = chosen.reduce((s, i) => s + i.cost, 0);
  const shownScore = result?.final_score ?? baseline.score;
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setConnecting(true);
    try {
      const next = await getSimulationData();
      if (version !== requestVersion.current) return;
      setData(next);
      setConnected(true);
      setDecisions([]);
      setResult(null);
      setActiveDistrict(
        Object.hasOwn(next.districts, "Нура")
          ? "Нура"
          : Object.keys(next.districts)[0],
      );
      setNotice("");
    } catch {
      if (version === requestVersion.current) setConnected(false);
    } finally {
      if (version === requestVersion.current) setConnecting(false);
    }
  }, []);
  useEffect(() => {
    load();
    return () => {
      requestVersion.current++;
    };
  }, [load]);
  function replaceDecisions(next) {
    if (busy) return;
    const expanded = next.map((d) => ({
      ...data.initiatives.find((i) => i.id === d.id),
      district: d.district,
    }));
    const error = validateSelection(expanded, data.budget);
    if (error) {
      setNotice(error);
      return;
    }
    setDecisions(next);
    setResult(null);
    setNotice("");
  }
  function toggle(item) {
    if (busy) return;
    replaceDecisions(
      decisions.some((d) => d.id === item.id)
        ? decisions.filter((d) => d.id !== item.id)
        : [
            ...decisions,
            {
              id: item.id,
              district: item.type === "district" ? activeDistrict : null,
            },
          ],
    );
  }
  function changeDistrict(id, name) {
    replaceDecisions(
      decisions.map((d) =>
        d.id === id
          ? {
              ...d,
              district: name,
            }
          : d,
      ),
    );
  }
  async function run() {
    if (busy || !connected || decisions.length !== 5) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await simulate(
        decisions.map((d) => ({
          initiative_id: d.id,
          district: d.district,
        })),
      );
      setResult(response);
      navigate("results");
    } catch (error) {
      setNotice(
        error.message === "Failed to fetch"
          ? "Связь с сервером потеряна. Убедитесь, что он запущен, и повторите расчёт."
          : error.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    connected,
    connecting,
    activeDistrict,
    setActiveDistrict,
    decisions,
    result,
    busy,
    notice,
    setNotice,
    baseline,
    names,
    district,
    chosen,
    used,
    shownScore,
    load,
    replaceDecisions,
    toggle,
    changeDistrict,
    run,
  };
}
