import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { YearResult, Season } from '../../engine';

interface ChartProps {
  yearResult: YearResult;
  history: YearResult[];
  season: Season;
}

export const DispatchChart: React.FC<ChartProps> = ({ yearResult, season }) => {
  const day = yearResult.days.find((d) => d.season === season) || yearResult.days[0];

  const data = day.hours.map((h) => ({
    hour: `${h.hour}시`,
    수요: Number((h.demandNetGWh).toFixed(1)),
    원자력: Number((h.gen.nuclear).toFixed(1)),
    석탄: Number((h.gen.coal).toFixed(1)),
    LNG: Number((h.gen.lng).toFixed(1)),
    태양광: Number((h.gen.solar).toFixed(1)),
    풍력: Number((h.gen.wind).toFixed(1)),
    ESS방전: Number((h.essDischargeGWh).toFixed(1)),
    미공급: Number((h.unservedGWh).toFixed(1)),
  }));

  return (
    <div style={{ height: '240px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="hour" stroke="#8b949e" fontSize={11} />
          <YAxis stroke="#8b949e" fontSize={11} unit=" GWh" />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
          <Area type="monotone" dataKey="원자력" stackId="1" stroke="#ab47bc" fill="#ab47bc" />
          <Area type="monotone" dataKey="석탄" stackId="1" stroke="#8d6e63" fill="#8d6e63" />
          <Area type="monotone" dataKey="LNG" stackId="1" stroke="#26a69a" fill="#26a69a" />
          <Area type="monotone" dataKey="풍력" stackId="1" stroke="#29b6f6" fill="#29b6f6" />
          <Area type="monotone" dataKey="태양광" stackId="1" stroke="#ffb300" fill="#ffb300" />
          <Area type="monotone" dataKey="ESS방전" stackId="1" stroke="#66bb6a" fill="#66bb6a" />
          <Area type="monotone" dataKey="미공급" stackId="1" stroke="#f85149" fill="#f85149" />
          <Line type="monotone" dataKey="수요" stroke="#ffffff" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PotentialAndCurtailChart: React.FC<ChartProps> = ({ yearResult, season }) => {
  const day = yearResult.days.find((d) => d.season === season) || yearResult.days[0];

  const data = day.hours.map((h) => ({
    hour: `${h.hour}시`,
    태양광잠재: Number(h.solarPotGWh.toFixed(1)),
    태양광실제: Number(h.gen.solar.toFixed(1)),
    풍력잠재: Number(h.windPotGWh.toFixed(1)),
    풍력실제: Number(h.gen.wind.toFixed(1)),
    출력제어: Number((h.curtailSolarGWh + h.curtailWindGWh).toFixed(1)),
  }));

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="hour" stroke="#8b949e" fontSize={11} />
          <YAxis stroke="#8b949e" fontSize={11} unit=" GWh" />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="태양광잠재" stroke="#ffe082" strokeDasharray="3 3" dot={false} />
          <Line type="monotone" dataKey="태양광실제" stroke="#ffb300" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="풍력잠재" stroke="#b3e5fc" strokeDasharray="3 3" dot={false} />
          <Line type="monotone" dataKey="풍력실제" stroke="#29b6f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="출력제어" stroke="#f85149" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EssSocChart: React.FC<ChartProps> = ({ yearResult, season }) => {
  const day = yearResult.days.find((d) => d.season === season) || yearResult.days[0];

  const data = day.hours.map((h) => ({
    hour: `${h.hour}시`,
    SOC: Number(h.socEndGWh.toFixed(1)),
    충전: Number(h.essChargeGWh.toFixed(1)),
    방전: Number(h.essDischargeGWh.toFixed(1)),
  }));

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="hour" stroke="#8b949e" fontSize={11} />
          <YAxis stroke="#8b949e" fontSize={11} unit=" GWh" />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
          <Area type="monotone" dataKey="SOC" stroke="#43a047" fill="#2e7d32" fillOpacity={0.4} />
          <Line type="monotone" dataKey="충전" stroke="#81c784" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="방전" stroke="#e57373" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GenerationShareChart: React.FC<ChartProps> = ({ history }) => {
  const data = history.map((h) => {
    const total = Object.values(h.generationTWh).reduce((a, b) => a + b, 0);
    return {
      year: `${h.year}`,
      태양광: total > 0 ? Number(((h.generationTWh.solar / total) * 100).toFixed(1)) : 0,
      풍력: total > 0 ? Number(((h.generationTWh.wind / total) * 100).toFixed(1)) : 0,
      원자력: total > 0 ? Number(((h.generationTWh.nuclear / total) * 100).toFixed(1)) : 0,
      석탄: total > 0 ? Number(((h.generationTWh.coal / total) * 100).toFixed(1)) : 0,
      LNG: total > 0 ? Number(((h.generationTWh.lng / total) * 100).toFixed(1)) : 0,
    };
  });

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="year" stroke="#8b949e" fontSize={11} />
          <YAxis stroke="#8b949e" fontSize={11} unit="%" domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="원자력" stackId="a" fill="#ab47bc" />
          <Bar dataKey="석탄" stackId="a" fill="#8d6e63" />
          <Bar dataKey="LNG" stackId="a" fill="#26a69a" />
          <Bar dataKey="풍력" stackId="a" fill="#29b6f6" />
          <Bar dataKey="태양광" stackId="a" fill="#ffb300" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiYearTrendChart: React.FC<ChartProps> = ({ history }) => {
  const data = history.map((h) => ({
    year: `${h.year}`,
    탄소배출Mt: Number(h.emissionsMt.toFixed(1)),
    미공급GWh: Number(h.unservedGWh.toFixed(1)),
    누적비용조원: Number((h.cumulativeCostEok / 10000).toFixed(1)),
  }));

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="year" stroke="#8b949e" fontSize={11} />
          <YAxis yAxisId="left" stroke="#8b949e" fontSize={11} />
          <YAxis yAxisId="right" orientation="right" stroke="#8b949e" fontSize={11} />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
          <Line yAxisId="left" type="monotone" dataKey="탄소배출Mt" stroke="#ff7043" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="미공급GWh" stroke="#f44336" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="누적비용조원" stroke="#42a5f5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
