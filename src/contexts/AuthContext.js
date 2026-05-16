import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { buscarUsuario } from '../firebase/db';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null); // dados do Firestore
  const [modo, setModo] = useState(null); // 'admin' | 'ranking' | 'corretor'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const dados = await buscarUsuario(firebaseUser.uid);
        setPerfil(dados);
        // Restaura modo da sessão
        const modoSalvo = sessionStorage.getItem('modo');
        if (modoSalvo) setModo(modoSalvo);
      } else {
        setUser(null);
        setPerfil(null);
        setModo(null);
        sessionStorage.removeItem('modo');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, senha, modoEscolhido) => {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const dados = await buscarUsuario(cred.user.uid);

    if (!dados) throw new Error('Usuário não encontrado no sistema.');
    if (!dados.ativo) throw new Error('Usuário inativo. Contate o administrador.');

    // Validações de acesso por modo
    if (modoEscolhido === 'corretor' && dados.role !== 'corretor') {
      await signOut(auth);
      throw new Error('Acesso negado. Este login é de administrador.');
    }
    if ((modoEscolhido === 'admin' || modoEscolhido === 'ranking') && dados.role !== 'admin') {
      await signOut(auth);
      throw new Error('Acesso negado. Apenas o administrador pode acessar este modo.');
    }

    setPerfil(dados);
    setModo(modoEscolhido);
    sessionStorage.setItem('modo', modoEscolhido);
    return dados;
  };

  const logout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('modo');
  };

  const isAdmin = () => perfil?.role === 'admin';
  const isCorretor = () => perfil?.role === 'corretor';

  return (
    <AuthContext.Provider value={{ user, perfil, modo, loading, login, logout, isAdmin, isCorretor }}>
      {children}
    </AuthContext.Provider>
  );
};
