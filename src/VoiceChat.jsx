import React, { useEffect, useRef, useState } from 'react';

const VoiceChat = ({ socket, roomId, userId, players, onDisconnect, localStream }) => {
    const [peers, setPeers] = useState({}); // { [userId]: stream }
    const peersRef = useRef({}); // { [userId]: RTCPeerConnection }
    const localStreamRef = useRef(null);

    const createPeerConnection = (remoteUserId, isInitiator) => {
        // Configuração STUN (Google é gratuito e confiável)
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice_signal', {
                    to: remoteUserId,
                    signal: { type: 'candidate', candidate: event.candidate },
                    from: userId
                });
            }
        };

        pc.ontrack = (event) => {
            setPeers(prev => ({ ...prev, [remoteUserId]: event.streams[0] }));
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        if (isInitiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit('voice_signal', {
                        to: remoteUserId,
                        signal: { type: 'offer', sdp: pc.localDescription },
                        from: userId
                    });
                })
                .catch(e => console.error("Erro ao criar oferta:", e));
        }

        peersRef.current[remoteUserId] = pc;
        return pc;
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Usa o stream passado pelo pai (App.jsx)
                localStreamRef.current = localStream;
                
                if (!localStream) {
                    throw new Error("Stream de áudio não disponível");
                }

                // Listeners de Sinalização
                socket.on('voice_joined', ({ userId: remoteUserId }) => {
                    console.log('Novo usuário no voz:', remoteUserId);
                    // Quem já está na sala inicia a conexão com quem entrou
                    createPeerConnection(remoteUserId, true);
                });

                socket.on('voice_left', ({ userId: remoteUserId }) => {
                    if (peersRef.current[remoteUserId]) {
                        peersRef.current[remoteUserId].close();
                        delete peersRef.current[remoteUserId];
                        setPeers(prev => {
                            const newPeers = { ...prev };
                            delete newPeers[remoteUserId];
                            return newPeers;
                        });
                    }
                });

                socket.on('voice_signal', async ({ from: remoteUserId, signal }) => {
                    let pc = peersRef.current[remoteUserId];
                    
                    if (!pc) {
                        if (signal.type === 'offer') {
                            pc = createPeerConnection(remoteUserId, false);
                        } else {
                            return; 
                        }
                    }

                    try {
                        if (signal.type === 'offer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            socket.emit('voice_signal', {
                                to: remoteUserId,
                                signal: { type: 'answer', sdp: pc.localDescription },
                                from: userId
                            });
                        } else if (signal.type === 'answer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                        } else if (signal.type === 'candidate') {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        }
                    } catch (e) {
                        console.error("Erro de sinalização:", e);
                    }
                });

                // Anuncia entrada
                socket.emit('voice_joined', { roomId, userId });

            } catch (err) {
                console.error("Erro mic:", err);
                if (onDisconnect) onDisconnect();
            }
        };

        init();

        return () => {
            socket.off('voice_joined');
            socket.off('voice_left');
            socket.off('voice_signal');
            socket.emit('voice_left', { roomId, userId });
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, [roomId, userId, socket, localStream]);

    return (
        <div className="fixed bottom-24 right-4 flex flex-col gap-2 pointer-events-none z-50">
            {Object.entries(peers).map(([id, stream]) => (
                <div key={id} className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 animate-in slide-in-from-right border border-white/10 shadow-lg">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-[10px] font-bold text-white">{players[id]?.name || 'Jogador'}</span>
                    <audio ref={el => { if(el) el.srcObject = stream }} autoPlay />
                </div>
            ))}
        </div>
    );
};

export default VoiceChat;
