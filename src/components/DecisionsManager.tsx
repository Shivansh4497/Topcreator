"use client";

import { useState } from "react";
import { triggerWeeklyStrategy, processTopic } from "@/app/actions";
import { Database } from "@/types/supabase";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type TopicScore = Database["public"]["Tables"]["topic_scores"]["Row"];

export default function DecisionsManager({ 
  decisions,
  topicScores 
}: { 
  decisions: Decision[];
  topicScores: TopicScore[];
}) {
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [loadingScore, setLoadingScore] = useState(false);

  const handleGenerateStrategy = async () => {
    setLoadingStrategy(true);
    try {
      await triggerWeeklyStrategy();
    } catch (e) {
      console.error(e);
      alert("Failed to generate strategy.");
    }
    setLoadingStrategy(false);
  };

  const handleScoreTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput) return;
    
    setLoadingScore(true);
    try {
      await processTopic(topicInput);
      setTopicInput("");
      // Refresh page to show new score
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to score topic.");
    }
    setLoadingScore(false);
  };

  return (
    <div className="flex flex-col gap-12 pb-10">
      
      {/* Weekly Strategy Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Weekly Decisions</h2>
            <p className="text-zinc-400 mt-1">AI-generated content strategy for your upcoming week.</p>
          </div>
          <button 
            onClick={handleGenerateStrategy}
            disabled={loadingStrategy}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {loadingStrategy ? "Generating..." : "Generate Next Week"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {decisions.length === 0 ? (
            <div className="col-span-3 bg-white/5 border border-white/10 p-8 rounded-2xl text-center text-zinc-500">
              No decisions generated yet. Click the button above to create your strategy.
            </div>
          ) : (
            decisions.map(d => (
              <div key={d.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                      {d.recommended_format}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${d.status === 'pending' ? 'bg-zinc-800 text-zinc-300' : d.status === 'made_it' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {d.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 leading-tight">{d.recommended_topic}</h3>
                  <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{d.reasoning}</p>
                  
                  <div className="space-y-3 mt-6">
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hook</p>
                      <p className="text-sm text-zinc-200 mt-1 italic">"{d.hook}"</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Caption Angle</p>
                      <p className="text-sm text-zinc-200 mt-1">{d.caption_angle}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <hr className="border-white/10" />

      {/* Topic Scorecard Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Topic Scorecard</h2>
          <p className="text-zinc-400 mt-1">Have an idea? Evaluate it instantly against your niche before filming.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form onSubmit={handleScoreTopic} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl sticky top-24">
              <label htmlFor="topic" className="block text-sm font-medium text-zinc-300 mb-2">New Idea / Topic</label>
              <textarea 
                id="topic"
                rows={3}
                required
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                placeholder="e.g. A day in the life of a software engineer working remotely..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-4 resize-none"
              />
              <button 
                type="submit"
                disabled={loadingScore || !topicInput}
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                {loadingScore ? "Scoring..." : "Score Topic"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {topicScores.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center text-zinc-500 flex-1 flex items-center justify-center">
                Enter an idea to see its predicted performance score.
              </div>
            ) : (
              topicScores.map(score => (
                <div key={score.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center justify-center min-w-[120px] p-4 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-1">Score</span>
                    <span className={`text-4xl font-extrabold ${score.score && score.score >= 70 ? 'text-green-400' : score.score && score.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score.score}
                    </span>
                    <span className={`mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${score.verdict === 'go' ? 'bg-green-500/20 text-green-400' : score.verdict === 'caution' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      {score.verdict}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-3">{score.topic_input}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">Demand</p>
                        <p className="text-sm font-medium text-zinc-200">{score.demand_score}/100</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">Competition</p>
                        <p className="text-sm font-medium text-zinc-200">{score.competition_score}/100</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">Trend</p>
                        <p className="text-sm font-medium text-zinc-200">{score.trend_score}/100</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold">Authority</p>
                        <p className="text-sm font-medium text-zinc-200">{score.authority_score}/100</p>
                      </div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                      <p className="text-xs text-indigo-300 font-semibold mb-1">Alternative Angle:</p>
                      <p className="text-sm text-indigo-100">{score.alternative_angle}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
