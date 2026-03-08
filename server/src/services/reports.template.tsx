import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#333' },
    header: { marginBottom: 20, borderBottom: '1pt solid #6d28d9', paddingBottom: 10, flexDirection: 'row', justifyBetween: 'space-between', alignItems: 'center' },
    titleSection: { flex: 1 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#6d28d9' },
    subtitle: { fontSize: 8, color: '#666', textTransform: 'uppercase', marginTop: 2 },
    tenantInfo: { textAlign: 'right' },
    tenantName: { fontSize: 10, fontWeight: 'bold' },
    reportInfo: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 10, borderRadius: 4 },
    infoBox: { flex: 1 },
    label: { fontSize: 7, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
    value: { fontSize: 9, fontWeight: 'bold' },
    table: { width: '100%', marginTop: 10 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottom: '1pt solid #e5e7eb', paddingVertical: 6 },
    tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #f3f4f6', paddingVertical: 8, alignItems: 'center' },
    tableCell: { flex: 1, paddingHorizontal: 4 },
    tableCellHeader: { fontSize: 7, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '0.5pt solid #e5e7eb', paddingTop: 10, textAlign: 'center' },
    footerText: { fontSize: 7, color: '#999' }
});

interface ReportProps {
    title: string;
    tenantName: string;
    period: string;
    data: any[];
    columns: { header: string; key: string; width?: string | number }[];
}

export const TabularReport = ({ title, tenantName, period, data, columns }: ReportProps) => (
    <Document title={title}>
        <Page size="A4" orientation="landscape" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Relatório Analítico de Gestão</Text>
                </View>
                <View style={styles.tenantInfo}>
                    <Text style={styles.tenantName}>{tenantName}</Text>
                    <Text style={{ fontSize: 7, color: '#666' }}>Sistema Locattus v2</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.reportInfo}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Período</Text>
                    <Text style={styles.value}>{period}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Registros</Text>
                    <Text style={styles.value}>{data.length}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Data de Emissão</Text>
                    <Text style={styles.value}>{new Date().toLocaleDateString('pt-BR')}</Text>
                </View>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    {columns.map((col, i) => (
                        <View key={i} style={[styles.tableCell, col.width ? { flex: 0, width: col.width } : {}]}>
                            <Text style={styles.tableCellHeader}>{col.header}</Text>
                        </View>
                    ))}
                </View>
                {data.map((row, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: '#fff' } : { backgroundColor: '#fafafa' }]}>
                        {columns.map((col, j) => (
                            <View key={j} style={[styles.tableCell, col.width ? { flex: 0, width: col.width } : {}]}>
                                <Text style={{ fontSize: 8 }}>{row[col.key] || '-'}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Relatório confidencial gerado via Locattus. O uso indevido destas informações é de responsabilidade do usuário.
                </Text>
            </View>
        </Page>
    </Document>
);
