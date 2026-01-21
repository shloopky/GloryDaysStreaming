const { useState, useEffect, useRef } = React;

// --- CREDENTIALS ---
const SB_URL = 'https://gzwjqzyedpxlhgwknndl.supabase.co';
const SB_KEY = 'sb_publishable_r4jrV0e282f2TNc1QExFOQ_XuFxdHsC';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('login'); // login, signup, forum
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Auth inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Check for existing session
        _supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                setView('forum');
            }
        });

        // Listen for auth changes
        _supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session) setView('forum');
        });
    }, []);

    useEffect(() => {
        if (user) fetchPosts();
    }, [user]);

    const fetchPosts = async () => {
        const { data } = await _supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
        setPosts(data || []);
    };

    const handleAuth = async (type) => {
        setLoading(true);
        try {
            if (type === 'signup') {
                const { error } = await _supabase.auth.signUp({ 
                    email, 
                    password, 
                    options: { data: { username: username } } 
                });
                if (error) throw error;
                alert("Check your email for confirmation!");
            } else {
                const { error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createPost = async () => {
        if (!newPost.trim()) return;
        const hashtags = newPost.match(/#[a-zA-Z0-9_]+/g) || [];
        
        const { error } = await _supabase.from('posts').insert([{
            content: newPost,
            username: user.user_metadata.username || user.email,
            user_id: user.id,
            hashtags: hashtags.map(h => h.slice(1))
        }]);

        if (!error) {
            setNewPost('');
            fetchPosts();
        }
    };

    if (view === 'login' || view === 'signup') {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl">
                    <h1 className="text-3xl font-bold text-center text-purple-800 mb-2">FORVM ROMANVM</h1>
                    <p className="text-center italic text-purple-600 mb-8">Veni, Vidi, Vici</p>
                    
                    <div className="space-y-4">
                        {view === 'signup' && (
                            <input className="w-full p-3 glass rounded-xl outline-none" placeholder="Username" 
                            value={username} onChange={e => setUsername(e.target.value)} />
                        )}
                        <input className="w-full p-3 glass rounded-xl outline-none" placeholder="Email" 
                        value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-3 glass rounded-xl outline-none" type="password" placeholder="Password" 
                        value={password} onChange={e => setPassword(e.target.value)} />
                        
                        <button onClick={() => handleAuth(view)} disabled={loading}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition">
                            {loading ? 'Processing...' : (view === 'login' ? 'Enter Forum' : 'Join Senate')}
                        </button>
                        
                        <p className="text-center text-sm text-purple-800 cursor-pointer" 
                        onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
                            {view === 'login' ? "New citizen? Sign up" : "Already a member? Login"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
            <header className="glass p-6 rounded-3xl mb-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-purple-900">FORVM ROMANVM</h1>
                <button onClick={() => _supabase.auth.signOut()} className="p-2 bg-red-500/20 text-red-700 rounded-full hover:bg-red-500 hover:text-white transition">
                   Logout
                </button>
            </header>

            <div className="glass p-6 rounded-3xl mb-8">
                <textarea className="w-full p-4 glass rounded-2xl outline-none resize-none" rows="3" 
                placeholder="Share your wisdom, citizen... #politics #philosophy"
                value={newPost} onChange={e => setNewPost(e.target.value)} />
                <button onClick={createPost} className="mt-4 px-8 py-2 bg-purple-600 text-white rounded-xl font-bold shadow-lg">
                    Post to Forum
                </button>
            </div>

            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="glass p-6 rounded-3xl shadow-lg">
                        <div className="flex justify-between mb-4">
                            <span className="font-bold text-purple-900">@{post.username}</span>
                            <span className="text-xs text-purple-700 opacity-70">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-800 text-lg mb-4">{post.content}</p>
                        <div className="flex gap-2">
                            {post.hashtags?.map(tag => (
                                <span key={tag} className="text-sm bg-purple-500/20 px-3 py-1 rounded-full text-purple-800">#{tag}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
