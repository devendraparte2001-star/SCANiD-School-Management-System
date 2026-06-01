using System.Collections.Concurrent;
using System.Collections.Generic;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Thread-safe in-memory queue for holding raw iodata scan lines prior to background database processing.
    /// Registered as a singleton in the app container.
    /// </summary>
    public interface IIodataQueueService
    {
        void Enqueue(string line);
        void EnqueueRange(IEnumerable<string> lines);
        bool TryDequeue(out string? line);
        int Count { get; }
    }

    public class IodataQueueService : IIodataQueueService
    {
        private readonly ConcurrentQueue<string> _queue = new ConcurrentQueue<string>();

        public void Enqueue(string line)
        {
            if (!string.IsNullOrWhiteSpace(line))
            {
                _queue.Enqueue(line.Trim());
            }
        }

        public void EnqueueRange(IEnumerable<string> lines)
        {
            foreach (var line in lines)
            {
                Enqueue(line);
            }
        }

        public bool TryDequeue(out string? line)
        {
            return _queue.TryDequeue(out line);
        }

        public int Count => _queue.Count;
    }
}
