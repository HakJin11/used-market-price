import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md shadow-lg flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">애플리케이션에 일시적인 문제가 발생했습니다</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                시세 데이터 분석 도중 예기치 않은 오류가 감지되었습니다. 아래의 재시도 버튼을 누르거나 새로고침을 진행해 주세요.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-left font-mono text-[10px] text-slate-400 max-h-24 overflow-y-auto break-all">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="mt-2 w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              시세 분석기 다시 작동하기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
