import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import authService from '@/services/authentication/authService';
import supervisorService from '@/services/supervisores/supervisorService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
} from 'react-native';

const IOS_BG = '#f5f5f5';
const IOS_BLUE = '#007AFF';
const IOS_RED = '#FF3B30';
const IOS_GRAY = '#8E8E93';
const SEPARATOR_COLOR = '#C6C6C8';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [showObjectivesModal, setShowObjectivesModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      supervisorService.getMe()
        .then(setUserData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Completá todos los campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    try {
      setPasswordLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      alert('Contraseña actualizada correctamente.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!newPhone) {
      alert('Por favor, ingresá un número de teléfono.');
      return;
    }
    try {
      setPhoneLoading(true);
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/api/profile/update/`, {
        method: 'PATCH',
        body: JSON.stringify({ phone: newPhone }),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        // Si no es JSON, mantenemos data como objeto vacío
      }

      if (!response.ok) throw new Error((data as any).detail || 'Error al actualizar el teléfono');

      alert('Teléfono actualizado correctamente.');
      setShowPhoneModal(false);
      const updatedUser = await supervisorService.getMe();
      setUserData(updatedUser);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const ProfileRow = ({
    label,
    value,
    onPress,
    isEditable = true,
    showChevron = true,
    isDestructive = false,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    isEditable?: boolean;
    showChevron?: boolean;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.rowContainer}
      onPress={onPress}
      disabled={!isEditable && !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <ThemedText style={[styles.rowLabel, isDestructive && { color: IOS_RED }]}>
          {label}
        </ThemedText>
        <View style={styles.rowRightSide}>
          {value && (
            <ThemedText style={styles.rowValue} numberOfLines={1}>
              {value}
            </ThemedText>
          )}
          {showChevron && isEditable && !isDestructive && (
            <Ionicons name="chevron-forward" size={20} color={SEPARATOR_COLOR} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: IOS_BG }}>
        <ActivityIndicator size="large" color={IOS_BLUE} />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Cambiar contraseña</ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Contraseña actual"
              placeholderTextColor="#8E8E93"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor="#8E8E93"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor="#8E8E93"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? <ActivityIndicator color="white" />
                  : <ThemedText style={styles.modalConfirmText}>Guardar</ThemedText>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPhoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Actualizar teléfono</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nuevo número de teléfono"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPhoneModal(false);
                  setNewPhone('');
                }}
              >
                <ThemedText style={styles.modalCancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleUpdatePhone}
                disabled={phoneLoading}
              >
                {phoneLoading
                  ? <ActivityIndicator color="white" />
                  : <ThemedText style={styles.modalConfirmText}>Guardar</ThemedText>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showObjectivesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowObjectivesModal(false)}
      >
        <View style={styles.modalObjectivesContainer}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>Objetivos vinculados</ThemedText>
              <ThemedText style={styles.modalSubtitle}>Puntos de control asignados</ThemedText>
            </View>
            <TouchableOpacity onPress={() => setShowObjectivesModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* ✅ corregido: objetivos_asignados */}
            {userData?.objetivos_asignados?.length > 0 ? (
              userData.objetivos_asignados.map((obj: any) => (
                <View key={obj.id} style={styles.objectiveDetailCard}>
                  <ThemedText style={styles.objectiveName}>{obj.nombre}</ThemedText>
                  <View style={styles.objectiveInfoRow}>
                    <Ionicons name="location-outline" size={16} color={IOS_GRAY} />
                    <ThemedText style={styles.objectiveInfoText}>{obj.direccion}</ThemedText>
                  </View>
                  {obj.telefono && (
                    <View style={styles.objectiveInfoRow}>
                      <Ionicons name="call-outline" size={16} color={IOS_GRAY} />
                      <ThemedText style={styles.objectiveInfoText}>{obj.telefono}</ThemedText>
                    </View>
                  )}
                  {obj.email && (
                    <View style={styles.objectiveInfoRow}>
                      <Ionicons name="mail-outline" size={16} color={IOS_GRAY} />
                      <ThemedText style={styles.objectiveInfoText}>{obj.email}</ThemedText>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyObjectives}>
                <Ionicons name="business-outline" size={60} color={SEPARATOR_COLOR} />
                <ThemedText style={styles.emptyText}>No hay objetivos vinculados asignados actualmente.</ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <View style={styles.imageWrapper}>
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarInitial}>
                {userData?.first_name?.[0]?.toUpperCase() ?? '?'}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userNameText}>
            {userData?.first_name} {userData?.last_name}
          </ThemedText>
          <ThemedText style={styles.userEmailText}>{userData?.email}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>INFORMACIÓN</ThemedText>
          <View style={styles.groupCard}>
            <ProfileRow
              label="Nombre y Apellido"
              value={`${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`}
            />
            <View style={styles.separator} />
            <ProfileRow label="Correo electrónico" value={userData?.email} />
            <View style={styles.separator} />
            <ProfileRow
              label="Número de teléfono"
              value={userData?.phone ?? 'No registrado'}
              onPress={() => {
                setNewPhone(userData?.phone ?? '');
                setShowPhoneModal(true);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>SEGURIDAD</ThemedText>
          <View style={styles.groupCard}>
            <ProfileRow
              label="Cambiar contraseña"
              value="********"
              onPress={() => setShowPasswordModal(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>SISTEMA</ThemedText>
          <View style={styles.groupCard}>
            <ProfileRow
              label="Objetivos vinculados"
              value={userData?.objetivos_asignados?.length > 0
                ? `${userData.objetivos_asignados.length} asignados`
                : 'Sin datos'}
              onPress={async () => {
                const updated = await supervisorService.getMe();
                setUserData(updated);
                setShowObjectivesModal(true);
              }}
            />
          </View>
          <ThemedText style={styles.footerNote}>
            Los objetivos vinculados son puntos de localización gestionados exclusivamente por los administradores desde el panel de control.
          </ThemedText>
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.groupCard}>
            <ProfileRow
              label="Cerrar sesión"
              isDestructive={true}
              showChevron={false}
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_BG,
  },
  scrollContent: {
    paddingVertical: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: IOS_BG,
  },
  titleText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'black',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: IOS_BG,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5EA',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d6d6d6',
  },
  avatarInitial: {
    fontSize: 40,
    color: '#646464',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: IOS_BLUE,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: IOS_BG,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  userEmailText: {
    fontSize: 16,
    color: IOS_GRAY,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: IOS_GRAY,
    marginBottom: 8,
    marginLeft: 16,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000000b0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  rowContainer: {
    paddingLeft: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000',
  },
  rowRightSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginLeft: 10,
  },
  rowValue: {
    fontSize: 17,
    color: IOS_GRAY,
    flexShrink: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEPARATOR_COLOR,
    marginHorizontal: 16,
  },
  footerNote: {
    fontSize: 13,
    color: IOS_GRAY,
    marginTop: 8,
    marginHorizontal: 16,
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: IOS_GRAY,
    marginTop: 2,
  },
  input: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalObjectivesContainer: {
    flex: 1,
    backgroundColor: IOS_BG,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectiveDetailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  objectiveName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  objectiveInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  objectiveInfoText: {
    fontSize: 15,
    color: '#48484A',
  },
  emptyText: {
    fontSize: 16,
    color: IOS_GRAY,
    textAlign: 'center',
  },
  emptyObjectives: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
});